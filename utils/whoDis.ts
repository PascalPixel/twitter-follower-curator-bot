import { readFile, readdir } from "fs/promises";
import type { UserV2 } from "twitter-api-v2";

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
    if (followers_count < 10_000 && ratio >= 3) {
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

    if (
      !userDetails.onAllowlist &&
      !userDetails.isFollower &&
      (userDetails.isUnderground || userDetails.isPopular)
    ) {
      console.log(
        "\x1b[32m%s\x1b[0m",
        userDetails.isUnderground ? "Underground?" : "Popular?!",
        "https://twitter.com/" + user.username
      );
    }
  }
}
