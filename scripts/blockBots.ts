import { readFile } from "fs/promises";
import type { TweetV2, UserV2 } from "twitter-api-v2";

import twitterClient from "../lib/twitterClient";
import { retry } from "../utils/retry";

async function findBots() {
  const raw = await readFile("./cache/tweets.json", "utf-8");
  const userDatas: {
    response: {
      _realData: { data?: TweetV2[]; meta: { result_count: number } };
    };
    follower: UserV2;
  }[] = JSON.parse(raw);

  const error = [];
  const bots = [];
  const ancient = [];
  const inactive = [];
  const active = [];
  const alive = [];

  for (const userData of userDatas) {
    const { response, follower } = userData;
    const rawTweets = response._realData.data;

    if (
      (follower.public_metrics?.tweet_count || 0) <= 10 &&
      (follower.public_metrics?.following_count || 0) <= 10 &&
      (follower.public_metrics?.followers_count || 0) <= 10
    ) {
      bots.push(follower);
      continue;
    }

    if (!rawTweets) {
      if ((follower.public_metrics?.followers_count || 0) < 100) {
        bots.push(follower);
        continue;
      } else {
        error.push(follower);
        continue;
      }
    }

    // last tweet was more than 5 years ago
    if (
      rawTweets &&
      rawTweets[0].created_at &&
      new Date(rawTweets[0].created_at) <
        new Date(new Date().getTime() - 5 * 365 * 24 * 60 * 60 * 1000)
    ) {
      ancient.push(follower);
      continue;
    }

    // last tweet was more than 365 days ago
    if (
      rawTweets &&
      rawTweets[0].created_at &&
      new Date(rawTweets[0].created_at) <
        new Date(new Date().getTime() - 365 * 24 * 60 * 60 * 1000)
    ) {
      inactive.push(follower);
      continue;
    }

    // last tweet was more than 30 days ago
    if (
      rawTweets &&
      rawTweets[0].created_at &&
      new Date(rawTweets[0].created_at) <
        new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000)
    ) {
      active.push(follower);
      continue;
    }

    alive.push(follower);
  }

  const usersToBlock = [...bots, ...error, ...ancient];
  usersToBlock.sort(
    (a, b) =>
      (a.public_metrics?.followers_count || 0) -
      (b.public_metrics?.followers_count || 0)
  );
  console.log(usersToBlock);

  console.log("Total:", userDatas.length);
  console.log(
    "Error:",
    error.length,
    `${Math.round((error.length / userDatas.length) * 100)}%`
  );
  console.log(
    "Bots:",
    bots.length,
    `${Math.round((bots.length / userDatas.length) * 100)}%`
  );
  console.log(
    "Ancient:",
    ancient.length,
    `${Math.round((ancient.length / userDatas.length) * 100)}%`
  );
  console.log(
    "Inactive:",
    inactive.length,
    `${Math.round((inactive.length / userDatas.length) * 100)}%`
  );
  console.log(
    "Active:",
    active.length,
    `${Math.round((active.length / userDatas.length) * 100)}%`
  );
  console.log(
    "Alive:",
    alive.length,
    `${Math.round((alive.length / userDatas.length) * 100)}%`
  );

  // block bots
  const userId = process.env.TWITTER_USER_ID || "";
  if (userId) {
    for (const user of usersToBlock) {
      try {
        await twitterClient.readWrite.block(userId, user.id);
        await twitterClient.readWrite.unblock(userId, user.id);
      } catch (error) {
        await retry(error);
      }
    }
  }
}

async function blockBots() {
  console.log("Starting...");

  await findBots();

  console.log("Done!");
}

blockBots();
