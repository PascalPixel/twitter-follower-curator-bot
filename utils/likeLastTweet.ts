import type { TwitterApiError } from "twitter-api-v2";
import { config as loadEnvVariables } from "dotenv";

import twitterClient from "../lib/twitterClient";
import { getFollowers } from "./getFollowers";

loadEnvVariables();

export default async function likeLastTweet() {
  const followers = await getFollowers();

  let activeCounter = 0;
  let inactiveCounter = 0;
  let tweetsLiked = 0;

  for (const user of followers) {
    let isInactive = true;

    // Inactive
    // unfollow if user's last tweet is more than 6 months old
    const response = await twitterClient.bearer.userTimeline(user.id, {
      max_results: 5,
      "tweet.fields": ["created_at"],
    });

    if (response?.data?.data?.length) {
      const tweets = response.data.data;
      const lastTweet = tweets[0];
      const lastTweetDate = lastTweet.created_at
        ? new Date(lastTweet.created_at)
        : new Date();
      const now = new Date();
      const timeSinceLastTweet = now.getTime() - lastTweetDate.getTime();
      const daysSinceLastTweet = timeSinceLastTweet / (1000 * 60 * 60 * 24);
      if (daysSinceLastTweet < 365) {
        isInactive = false;
      }

      // if last tweet was within 14 days, like it
      if (!isInactive) {
        if (daysSinceLastTweet < 14) {
          try {
            await twitterClient.readWrite.like(
              process.env.TWITTER_USER_ID || "",
              lastTweet.id
            );
            tweetsLiked += 1;
            console.log(
              `Liked tweet:`,
              `\x1b[90m%s\x1b[0m`,
              `${lastTweet.text.substring(0, 20)}...`
            );
          } catch (error) {
            const err = error as TwitterApiError;
            console.log(err);
          }
        }
      }
    }

    // Active
    if (!isInactive) {
      activeCounter += 1;
      console.log(
        `\x1b[32m%s\x1b[0m`,
        `Active:`,
        `${user.name} (@${user.username})`
      );
    }

    // Inactive
    if (isInactive) {
      inactiveCounter += 1;
      console.log(
        // red
        `\x1b[31m%s\x1b[0m`,
        `Inactive:`,
        `${user.name} (@${user.username})`
      );
    }
  }

  console.log(`Active: ${activeCounter}`);
  console.log(`Inactive: ${inactiveCounter}`);
  console.log(`Tweets Liked: ${tweetsLiked}`);
}
