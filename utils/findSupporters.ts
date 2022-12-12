import twitterClient from "../lib/twitterClient";

export default async function findSupporters() {
  if (!process.env.TWITTER_USER_ID) {
    throw new Error("TWITTER_USER_ID is not set");
  }

  // get my last 100 tweets
  const response = await twitterClient.bearer.userTimeline(
    process.env.TWITTER_USER_ID,
    {
      max_results: 5,
    }
  );

  const tweets = response.data.data;

  // log tweets
  console.log(tweets);

  // GET /2/tweets/:id/liking_users
  const likesByUser = {}; // Initialize an object to store the number of likes by each user

  // Create a function to wait until the rate limit resets
  const waitForRateLimitReset = (resetTime) => {
    // Calculate the time remaining until the rate limit resets
    const timeRemaining = resetTime * 1000 - Date.now();
    // Wait for the time remaining before continuing the loop
    return new Promise((resolve) => setTimeout(resolve, timeRemaining));
  };

  // Create a function to get the liking users for each tweet and update the likesByUser object
  const getLikingUsers = async (tweet) => {
    try {
      // Get the liking users for the tweet
      const response = await twitterClient.bearer.tweetLikedBy(tweet.id);
      // Get the liking users from the response
      const users = response.data;
      // Update the likesByUser object with the number of likes by each user
      users.forEach((user) => {
        likesByUser[user.username] = likesByUser[user.username]
          ? likesByUser[user.username] + 1
          : 1;
      });
    } catch (error) {
      // Check if the error is a rate limit error
      if (error.code === 429) {
        // If the error is a rate limit error, wait for the rate limit to reset before retrying
        console.log("Rate limit reached. Waiting for reset...");
        await waitForRateLimitReset(error.rateLimit.reset);
        await getLikingUsers(tweet); // Retry the request
      } else {
        // If the error is not a rate limit error, throw the error
        throw error;
      }
    }
  };

  // Loop through each tweet and get the liking users
  await Promise.all(
    // FIXME; only picking one now
    [tweets[0]].map(async (tweet) => {
      try {
        await getLikingUsers(tweet);
      } catch (error) {
        // Stop the loop if an error is thrown
        console.error(error);
        return;
      }
    })
  );

  console.log(likesByUser);
}
