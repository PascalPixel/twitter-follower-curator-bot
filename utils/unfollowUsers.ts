import { readFile, readdir } from "fs/promises";
import type { TwitterApiError, UserV2 } from "twitter-api-v2";

import twitterClient from "../lib/twitterClient";
import { getFollowers } from "./getFollowers";

export default async function unfollowUsers(type = "following") {
  // import allowlist
  const allowlistRaw = await readFile(
    `${process.cwd()}/allowlist.json`,
    "utf-8"
  );
  const allowlist: string[] = JSON.parse(allowlistRaw);

  const fileNames = await readdir(`${process.cwd()}/cache`);
  const usersFileNames = fileNames.filter((fileName) =>
    fileName.includes(`${type}-`)
  );
  const usersFileDates = usersFileNames.map(
    (fileName) => fileName.split(`${type}-`)[1].split(".")[0]
  );
  const usersFileDatesSorted = usersFileDates.sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Get most recent file
  const mostRecentFileDate =
    usersFileDatesSorted[usersFileDatesSorted.length - 1];
  const mostRecentFile = `${process.cwd()}/cache/${type}-${mostRecentFileDate}.json`;
  const mostRecentFileData = await readFile(mostRecentFile, "utf-8");

  const users: UserV2[] = JSON.parse(mostRecentFileData);

  // sort by followers, ascending upward
  const sortedUsers = users.sort(
    (a, b) =>
      (a.public_metrics?.followers_count || 0) -
      (b.public_metrics?.followers_count || 0)
  );

  // get followers
  const followers = await getFollowers();
  const followerlist = followers.map((follower) => follower.username);

  // unfollow unless in allowlist
  for (const user of sortedUsers) {
    const followers_count = user.public_metrics?.followers_count || 0;
    const following_count = user.public_metrics?.following_count || 0;
    const ratio = followers_count / following_count;

    // user details
    const userDetails = {
      onAllowlist: false,
      isFollower: false,
      isUnderground: false,
      isPopular: false,
      isBot: false,
      isInactive: false,
    };

    // if user is in allowlist
    if (allowlist.includes(user.username)) {
      userDetails.onAllowlist = true;
    }

    // if user is a follower
    if (followerlist.includes(user.username)) {
      userDetails.isFollower = true;
    }

    // if user has
    // - more than a ratio of 1:2 followers to following
    // - less than 10k followers
    if (followers_count < 10_000 && ratio >= 2) {
      userDetails.isUnderground = true;
    }

    // if user has
    // - more than a ratio of 1:20 followers to following
    // - more than 10k followers
    if (followers_count > 10_000 && ratio >= 20) {
      userDetails.isPopular = true;
    }

    // if user follows more than 4k people, they are not actually engaging
    if (following_count > 4_000) {
      userDetails.isBot = true;
    }

    // if user has less than 1_000 followers, they are probably a bot
    if (followers_count < 1_000) {
      userDetails.isBot = true;
    }

    // if ratio is less than 1:1, they are probably a bot
    if (ratio <= 1) {
      userDetails.isBot = true;
    }

    // Inactive
    // unfollow is user's last tweet is more than 1 year old
    // if (!userDetails.onAllowlist) {
    //   const response = await twitterClient.bearer.userTimeline(user.id, {
    //     max_results: 5,
    //     "tweet.fields": ["created_at"],
    //   });
    //   if (response?.data?.data?.length) {
    //     const tweets = response.data.data;
    //     const lastTweet = tweets[0];
    //     const lastTweetDate = lastTweet.created_at
    //       ? new Date(lastTweet.created_at)
    //       : new Date();
    //     const now = new Date();
    //     const timeSinceLastTweet = now.getTime() - lastTweetDate.getTime();
    //     const daysSinceLastTweet = timeSinceLastTweet / (1000 * 60 * 60 * 24);
    //     if (daysSinceLastTweet > 365) {
    //       userDetails.isInactive = true;
    //     }
    //   }
    // }

    // continue conditions
    let willUnfollow = true;
    if (userDetails.onAllowlist || userDetails.isFollower) {
      willUnfollow = false;
    } else if (
      !userDetails.isBot &&
      !userDetails.isInactive &&
      (userDetails.isUnderground || userDetails.isPopular)
    ) {
      willUnfollow = false;
    }

    // log user details
    console.log(
      willUnfollow ? "\x1b[31m%s\x1b[0m" : "\x1b[32m%s\x1b[0m",
      willUnfollow ? "Unfollow" : "Skipping",
      `@${user.username.padEnd(16).slice(0, 16)}`,
      [
        userDetails.onAllowlist ? "A" : "_",
        userDetails.isFollower ? "F" : "_",
        userDetails.isUnderground ? "U" : "_",
        userDetails.isPopular ? "P" : "_",
        userDetails.isBot ? "B" : "_",
        userDetails.isInactive ? "I" : "_",
      ].join(""),
      "\t",
      following_count,
      "\t",
      followers_count,
      "\t",

      Math.round(ratio) === Infinity ? followers_count : Math.round(ratio)
    );

    if (!willUnfollow) continue;

    try {
      // wait 300ms between unfollows
      await new Promise((resolve) => setTimeout(resolve, 300));

      // unfollow (50 per 15 minutes)
      await twitterClient.readWrite.unfollow(
        process.env.TWITTER_USER_ID || "",
        user.id
      );
    } catch (err) {
      const e = err as TwitterApiError;

      if (e.code === 429) {
        // wait until rate limit resets
        const rateLimit = e.rateLimit || { reset: 0 };
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
        continue;
      } else {
        console.error(e);
        break;
      }
    }
  }
}
