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

  // sort by followers, ascending
  const sortedUsers = users.sort(
    (a, b) =>
      (b.public_metrics?.followers_count || 0) -
      (a.public_metrics?.followers_count || 0)
  );

  // get ids
  const followingHandles = sortedUsers.map((user) => user.username);

  // get followers
  const followers = await getFollowers();
  const followersHandles = followers.map((follower) => follower.username);

  // unfollow unless in allowlist
  for (const id of followingHandles) {
    try {
      const userData = users.find((user) => user.username === id);

      // if user is not in cache, skip
      if (!userData) continue;

      // if user is in allowlist, skip
      if (allowlist.includes(id)) {
        console.log(`Skipping ${id} because they are in the allowlist`);
        continue;
      }

      // if user is a follower, skip
      if (followersHandles.includes(id)) {
        console.log(`Skipping ${id} because they are a follower`);
        continue;
      }

      // if user has more than a ratio of 1:5 followers to following, skip
      if (
        (userData.public_metrics?.followers_count || 0) /
          (userData.public_metrics?.following_count || 0) >
        5
      ) {
        console.log(`Skipping ${id} because they have a high following ratio`);
        continue;
      }

      // if a user has more than 10000 followers, skip
      if ((userData.public_metrics?.followers_count || 0) > 10000) {
        console.log(
          `Skipping ${id} because they have more than 10000 followers`
        );
        continue;
      }

      // get user ID from username
      const user = await twitterClient.readWrite.userByUsername(id);

      // unfollow (50 per 15 minutes)
      await twitterClient.readWrite.unfollow(
        process.env.TWITTER_USER_ID || "",
        user.data.id
      );

      // Success
      console.log(`Unfollowed ${id}`);
    } catch (err) {
      const e = err as TwitterApiError;
      console.log(`Error unfollowing ${id}`);
      // if rateLimit
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

        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        console.error(e);
        break;
      }
    }
  }
}
