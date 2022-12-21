import { config as loadEnvVariables } from "dotenv";
import type { UserV2 } from "twitter-api-v2";

import twitterClient from "../lib/twitterClient";
import { getFollowers } from "./getFollowers";
import { retry } from "./retry";

loadEnvVariables();

export default async function likeLastTweet() {
  const followers = await getFollowers();

  let superActiveCounter = 0;
  let activeCounter = 0;
  let inactiveCounter = 0;

  const tweetIdsToLike: string[] = [];

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

          // like last 5 tweets
          tweetIdsToLike.push(lastTweet.id);
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

  let tweetsLiked = 0;

  for (const tweetId of tweetIdsToLike) {
    try {
      await twitterClient.readWrite.like(
        process.env.TWITTER_USER_ID || "",
        tweetId
      );
      tweetsLiked += 1;
      console.log(`Liked tweet: ${tweetId}`);
    } catch (err) {
      await retry(err);
      continue;
    }
  }

  console.log(`Tweets Liked: ${tweetsLiked}`);

  const handlesOfLikers: UserV2[] = [];

  for (const tweetId of tweetIdsToLike) {
    try {
      const response = await twitterClient.bearer.tweetLikedBy(tweetId);
      if (response && response.data) {
        const users = response.data;
        for (const user of users) {
          handlesOfLikers.push(user);
        }
      }
    } catch (err) {
      await retry(err);
      continue;
    }
  }

  console.log(`Handles of Likers: ${handlesOfLikers.length}`);

  const tweetIdsOfLikersToLike: string[] = [];

  for (const user of handlesOfLikers) {
    try {
      const response = await twitterClient.bearer.userTimeline(user.id, {
        max_results: 5,
        "tweet.fields": ["created_at"],
      });

      // check if last tweet was within 30 days or 365 days
      if (response?.data?.data?.length) {
        const tweets = response.data.data;
        const lastTweet = tweets[0];
        tweetIdsOfLikersToLike.push(lastTweet.id);
      }
    } catch (err) {
      await retry(err);
      continue;
    }
  }

  console.log(`Tweet Ids of Likers to Like: ${tweetIdsOfLikersToLike.length}`);

  let tweetsLikedOfLikers = 0;

  for (const tweetId of tweetIdsOfLikersToLike) {
    try {
      await twitterClient.readWrite.like(
        process.env.TWITTER_USER_ID || "",
        tweetId
      );
      tweetsLikedOfLikers += 1;
      console.log(`Liked tweet of liker: ${tweetId}`);
    } catch (err) {
      await retry(err);
      continue;
    }
  }

  console.log(`Tweets Liked of Likers: ${tweetsLikedOfLikers}`);
}
