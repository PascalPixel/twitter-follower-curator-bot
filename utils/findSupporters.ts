import { TweetV2, TwitterApiError } from "twitter-api-v2";
import twitterClient from "../lib/twitterClient";

export default async function findSupporters() {
  if (!process.env.TWITTER_USER_ID) {
    throw new Error("TWITTER_USER_ID is not set");
  }

  // get my last 100 tweets
  const response = await twitterClient.bearer.userTimeline(
    process.env.TWITTER_USER_ID,
    {
      max_results: 100,
      exclude: ["retweets", "replies"],
    }
  );

  const tweets = response.data.data;

  // GET /2/tweets/:id/liking_users
  const likesByUser: { username: string; count: number }[] = [];

  // Create a function to get the liking users for each tweet and update the likesByUser object
  const getLikingUsers = async (tweet: TweetV2) => {
    try {
      // Get the liking users for the tweet
      const response = await twitterClient.bearer.tweetLikedBy(tweet.id);
      if (response && response.data) {
        // Get the liking users from the response
        const users = response.data;
        // Update the likesByUser object with the number of likes by each user
        users.forEach((user) => {
          const existingUser = likesByUser.find(
            (userObj) => userObj.username === user.username
          );
          if (existingUser) {
            existingUser.count++;
          } else {
            likesByUser.push({ username: user.username, count: 1 });
          }
        });
      } else {
        console.log("Issue", tweet.id);
      }
    } catch (err) {
      // TwitterApiError
      const error = err as TwitterApiError;
      // Check if the error is a rate limit error
      if (error.code === 429) {
        // wait until rate limit resets
        const rateLimit = error.rateLimit || { reset: 0 };
        const resetTime = rateLimit.reset * 1000;
        const now = new Date().getTime();
        const waitTime = resetTime - now;

        // print minutes and seconds waiting
        console.log(
          `Waiting ${Math.floor(waitTime / 1000 / 60)}m ${
            Math.floor(waitTime / 1000) % 60
          }s`
        );

        // wait
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        // Retry the request
        await getLikingUsers(tweet);
      } else {
        // If the error is not a rate limit error, throw the error and stop the loop
        throw error;
      }
    }
  };

  try {
    // Loop through each tweet and get the liking users
    for (const tweet of tweets) {
      await getLikingUsers(tweet);
    }
  } catch (err) {
    console.log(err);
  }

  // Sort the likesByUser object by the number of likes
  const sortedLikesByUser = likesByUser.sort((a, b) => b.count - a.count);
  console.log(sortedLikesByUser);
}
