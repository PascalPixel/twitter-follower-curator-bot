import twitterClient from "../lib/twitterClient";
import { retry } from "./retry";

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

  // Loop through each tweet and get the liking users
  for (const tweet of tweets) {
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
        console.log("Issue", tweet.id, response);
      }
    } catch (err) {
      await retry(err);
    }
  }

  // Sort the likesByUser object by the number of likes
  const sortedLikesByUser = likesByUser.sort((a, b) => b.count - a.count);
  console.log(sortedLikesByUser);
}
