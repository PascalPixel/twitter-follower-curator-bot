import { writeFile } from "fs/promises";
import { TweetUserTimelineV2Paginator, UserV2 } from "twitter-api-v2";
import twitterClient from "../lib/twitterClient";
import { getFollowers } from "../utils/getFollowers";
import { retry } from "../utils/retry";

async function getTweets() {
  // get all followers
  const followers = await getFollowers();

  // get the last 100 tweets for each follower and like count
  const tweets: { response: TweetUserTimelineV2Paginator; follower: UserV2 }[] =
    [];

  for (const follower of followers) {
    const getResponse = async () => {
      const response = await twitterClient.bearer.userTimeline(follower.id, {
        max_results: 100,
        "tweet.fields": ["created_at", "public_metrics"],
        exclude: ["replies", "retweets"],
      });

      tweets.push({ response, follower });
    };

    try {
      console.log(`Getting tweets for ${follower.username}`);
      await getResponse();
    } catch (err) {
      console.log(`Error getting tweets for ${follower.username}`);
      await retry(err);
      console.log(`Getting tweets for ${follower.username}`);
      await getResponse();
    }
  }

  // save to json file
  await writeFile("./cache/tweets.json", JSON.stringify(tweets, null, 2));
}

async function tweets() {
  console.log("Starting...");

  await getTweets();

  console.log("Done!");
}

tweets();
