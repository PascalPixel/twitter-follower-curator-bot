import twitterClient from "../lib/twitterClient.js";

export default async function findFans() {
  if (!process.env.TWITTER_USER_ID) {
    throw new Error("TWITTER_USER_ID is not set");
  }

  let likesByUser = {};

  // get my last 100 tweets
  const response = await twitterClient.bearer.userTimeline(
    process.env.TWITTER_USER_ID,
    {
      max_results: 5,
    }
  );

  const tweets = response.data.data;

  // GET /2/tweets/:id/liking_users
  tweets.forEach(async (tweet) => {
    const response = await twitterClient.bearer.tweetLikedBy(tweet.id);
    const users = response.data;
    users.forEach((user) => {
      likesByUser[user.username] = likesByUser[user.username]
        ? likesByUser[user.username] + 1
        : 1;
    });
  });

  console.log(likesByUser);
}
