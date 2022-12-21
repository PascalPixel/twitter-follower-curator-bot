import { config as loadEnvVariables } from "dotenv";

import twitterClient from "../lib/twitterClient";
import { getFollowers } from "./getFollowers";
import { retry } from "./retry";

loadEnvVariables();

export default async function analyzeActives() {
  const followers = await getFollowers();

  let superActiveCounter = 0;
  let activeCounter = 0;
  let inactiveCounter = 0;

  for (const user of followers) {
    try {
      let isSuperActive = false;
      let isActive = false;

      // get last 5 tweets
      const response = await twitterClient.bearer.userTimeline(user.id, {
        max_results: 5,
        "tweet.fields": ["created_at"],
      });

      // check if last tweet was within 30 days or 365 days
      if (response?.data?.data?.length) {
        const tweets = response.data.data;
        const lastTweet = tweets[0];
        const lastTweetDate = lastTweet.created_at
          ? new Date(lastTweet.created_at)
          : new Date();
        const now = new Date();
        const timeSinceLastTweet = now.getTime() - lastTweetDate.getTime();
        const daysSinceLastTweet = timeSinceLastTweet / (1000 * 60 * 60 * 24);
        if (daysSinceLastTweet < 30) {
          isSuperActive = true;
        } else if (daysSinceLastTweet < 365) {
          isActive = true;
        }
      }

      if (isSuperActive) {
        superActiveCounter += 1;
        console.log(
          `\x1b[36m%s\x1b[0m`,
          `Super Active:`,
          `${user.name} (@${user.username})`
        );
      } else if (isActive) {
        activeCounter += 1;
        console.log(
          `\x1b[32m%s\x1b[0m`,
          `Active:`,
          `${user.name} (@${user.username})`
        );
      } else if (!isActive) {
        inactiveCounter += 1;
        console.log(
          // red
          `\x1b[31m%s\x1b[0m`,
          `Inactive:`,
          `${user.name} (@${user.username})`
        );
      }
    } catch (err) {
      await retry(err);
      continue;
    }
  }

  console.log(`Super Active: ${superActiveCounter}`);
  console.log(`Active: ${activeCounter}`);
  console.log(`Inactive: ${inactiveCounter}`);
}
