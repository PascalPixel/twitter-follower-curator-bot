import { readFile } from "fs/promises";
import type { TweetV2, UserV2 } from "twitter-api-v2";

import twitterClient from "../lib/twitterClient";
import { getFollowers } from "../utils/getFollowers";
import { retry } from "../utils/retry";

async function findBots() {
  const raw = await readFile("./cache/tweets.json", "utf-8");
  const userDatas: {
    response: {
      _realData: { data?: TweetV2[]; meta: { result_count: number } };
    };
    follower: UserV2;
  }[] = JSON.parse(raw);

  const followers = await getFollowers();
  const followersUsernames = followers.map((follower) => follower.username);

  // only keep userDatas that are still following
  const users = userDatas.filter((userData) =>
    followersUsernames.includes(userData.follower.username)
  );

  const error = [];
  const bots = [];
  const ancient = [];
  const inactive = [];
  const active = [];
  const alive = [];

  for (const userData of users) {
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
      error.push(follower);
      continue;
    }

    if (
      rawTweets &&
      rawTweets[0].created_at &&
      new Date(rawTweets[0].created_at) <
        new Date(new Date().getTime() - 5 * 365 * 24 * 60 * 60 * 1000)
    ) {
      ancient.push(follower);
      continue;
    }

    if (
      rawTweets &&
      rawTweets[0].created_at &&
      new Date(rawTweets[0].created_at) <
        new Date(new Date().getTime() - 1 * 365 * 24 * 60 * 60 * 1000)
    ) {
      inactive.push(follower);
      continue;
    }

    if (
      rawTweets &&
      rawTweets[0].created_at &&
      new Date(rawTweets[0].created_at) <
        new Date(new Date().getTime() - 0.5 * 365 * 24 * 60 * 60 * 1000)
    ) {
      active.push(follower);
      continue;
    }

    alive.push(follower);
  }

  console.log("Total:", users.length);
  console.log(
    "Error:",
    error.length,
    `${Math.round((error.length / users.length) * 100)}%`
  );
  console.log(
    "Bots:",
    bots.length,
    `${Math.round((bots.length / users.length) * 100)}%`
  );
  console.log(
    "Ancient:",
    ancient.length,
    `${Math.round((ancient.length / users.length) * 100)}%`
  );
  console.log(
    "Inactive:",
    inactive.length,
    `${Math.round((inactive.length / users.length) * 100)}%`
  );
  console.log(
    "Active:",
    active.length,
    `${Math.round((active.length / users.length) * 100)}%`
  );
  console.log(
    "Alive:",
    alive.length,
    `${Math.round((alive.length / users.length) * 100)}%`
  );

  // block bots
  const usersToBlock = [
    // ...error,
    ...bots,
    ...ancient,
  ];
  usersToBlock.sort(
    (a, b) =>
      (a.public_metrics?.followers_count || 0) -
      (b.public_metrics?.followers_count || 0)
  );
  const userId = process.env.TWITTER_USER_ID || "";
  if (userId) {
    for (const [index, user] of usersToBlock.entries()) {
      // progress bar
      const total = usersToBlock.length;
      const percent = 100 - ((total - index) / total) * 100;
      const bar = "=".repeat(Math.round(percent / 4));
      const spaces = " ".repeat(25 - bar.length);
      const timeLeft = (total - index) * 15;
      const hoursLeft = Math.floor(timeLeft / 3600);
      const minutesLeft = Math.floor((timeLeft % 3600) / 60);
      console.log(
        `[${bar}${spaces}] ${percent.toFixed(0)}% ${hoursLeft}h ${minutesLeft}m`
      );

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
