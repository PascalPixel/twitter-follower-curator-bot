import { readdir, readFile, writeFile } from "fs/promises";
import allowlist from "./allowlist.js";

async function getFollowers() {
  const fileNames = await readdir("./cache");
  // find file with latest date
  const followersFileNames = fileNames.filter((fileName) =>
    fileName.includes("followers-")
  );
  const followersFileDates = followersFileNames.map(
    (fileName) => fileName.split("followers-")[1].split(".")[0]
  );
  const followersFileDatesSorted = followersFileDates.sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  const mostRecentFileDate =
    followersFileDatesSorted[followersFileDatesSorted.length - 1];
  const mostRecentFile = `./cache/followers-${mostRecentFileDate}.json`;
  const mostRecentFileData = await readFile(mostRecentFile, "utf-8");

  /** @type import("twitter-api-v2").UserV2[] */
  const users = JSON.parse(mostRecentFileData);

  return users;
}

async function getFollowing() {
  const fileNames = await readdir("./cache");
  // find file with latest date
  const followingFileNames = fileNames.filter((fileName) =>
    fileName.includes("following-")
  );
  const followingFileDates = followingFileNames.map(
    (fileName) => fileName.split("following-")[1].split(".")[0]
  );
  const followingFileDatesSorted = followingFileDates.sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  const mostRecentFileDate =
    followingFileDatesSorted[followingFileDatesSorted.length - 1];
  const mostRecentFile = `./cache/following-${mostRecentFileDate}.json`;
  const mostRecentFileData = await readFile(mostRecentFile, "utf-8");

  /** @type import("twitter-api-v2").UserV2[] */
  const users = JSON.parse(mostRecentFileData);

  return users;
}

export async function report2Following() {
  console.log("Starting...");

  const followers = await getFollowers();
  const following = await getFollowing();

  const usersMinusKeepList = following.filter(
    (user) => !allowlist.includes(user.username)
  );

  const usersMinusKeepListMinusFollowingMe = usersMinusKeepList.filter(
    (user) => !followers.some((follower) => follower.username === user.username)
  );

  const usersMinusKeepListMinusFollowingMeWithMetrics =
    usersMinusKeepListMinusFollowingMe.map((user) => [
      user.public_metrics?.following_count,
      user.public_metrics?.followers_count,
      Math.round(
        user.public_metrics?.followers_count /
          user.public_metrics?.following_count
      ),
      `https://twitter.com/${user.username}`,
    ]);

  const usersMinusKeepListMinusFollowingMeWithMetricsSorted =
    usersMinusKeepListMinusFollowingMeWithMetrics.sort((a, b) => b[2] - a[2]);

  await writeFile(
    `./cache/top-following-${new Date().toISOString().substring(0, 10)}.json`,
    JSON.stringify(usersMinusKeepListMinusFollowingMeWithMetricsSorted).replace(
      /\],/g,
      "],\n"
    )
  );

  console.log("Done!");
}

// find followers with highest ratio
export async function report2Followers() {
  console.log("Starting...");

  const users = await getFollowers();

  const topUsers = users.map((user) => [
    user.public_metrics?.following_count,
    user.public_metrics?.followers_count,
    Math.round(
      user.public_metrics?.followers_count /
        user.public_metrics?.following_count
    ),
    `https://twitter.com/${user.username}`,
  ]);

  const filteredUsers = topUsers.filter((user) => user[1] > 0);

  const sortedUsers = filteredUsers.sort((a, b) => b[2] - a[2]);

  await writeFile(
    `./cache/top-followers-${new Date().toISOString().substring(0, 10)}.json`,
    JSON.stringify(sortedUsers).replace(/\],/g, "],\n")
  );

  console.log("Done!");
}

async function main() {
  report2Following();
  report2Followers();
}

main();
