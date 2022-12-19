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

    // should we unfollow?
    let shouldUnfollow = true;

    // if user is a follower, skip
    if (followerlist.includes(user.username)) {
      console.log(
        // green
        "\x1b[32m%s\x1b[0m",
        `Skipping  `,
        `@${user.username} because they are a follower`
      );
      shouldUnfollow = false;
    }

    // if user is in allowlist, skip
    if (allowlist.includes(user.username)) {
      console.log(
        // yellow
        "\x1b[33m%s\x1b[0m",
        `Skipping  `,
        `@${user.username} because they are in the allowlist`
      );
      shouldUnfollow = false;
    }

    // skip if user has
    // - more than a ratio of 1:2 followers to following
    // - more than 1k followers
    if (followers_count / following_count > 2 && followers_count > 1_000) {
      console.log(
        // dark gray
        "\x1b[90m%s\x1b[0m",
        `Skipping  `,
        `@${user.username} because they have a >2 ratio + >1k followers`
      );
      shouldUnfollow = false;
    }

    // skip if user has
    // - more than a ratio of 1:10 followers to following
    // - more than 10k followers
    if (followers_count / following_count > 10 && followers_count > 10_000) {
      console.log(
        // magenta
        "\x1b[35m%s\x1b[0m",
        `Skipping  `,
        `@${user.username} because they have a >10 ratio + >10k followers`
      );
      shouldUnfollow = false;
    }

    // if user follows more than 10k people, they are probably a bot
    if (following_count > 10_000) {
      console.log(
        // red
        "\x1b[31m%s\x1b[0m",
        `Bot       `,
        `@${user.username} because they follow >10k people`
      );
      shouldUnfollow = true;
    }

    // Skip unfollow if we shouldn't unfollow
    if (!shouldUnfollow) continue;

    try {
      // unfollow (50 per 15 minutes)
      await twitterClient.readWrite.unfollow(
        process.env.TWITTER_USER_ID || "",
        user.id
      );

      // Success
      console.log(
        // red
        "\x1b[31m%s\x1b[0m",
        `Unfollowed`,
        `@${user.username}`
      );

      // wait 300ms between unfollows
      await new Promise((resolve) => setTimeout(resolve, 300));
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
