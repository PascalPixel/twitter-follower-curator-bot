import { config as loadEnvVariables } from "dotenv";
import { readdir, readFile, writeFile } from "fs/promises";
import { TwitterApi } from "twitter-api-v2";

loadEnvVariables();

if (!process.env.TWITTER_BEARER_TOKEN) {
  throw new Error("TWITTER_BEARER_TOKEN is not set");
}

const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN).v2
  .readOnly;

async function getFollowers() {
  if (!process.env.TWITTER_USER_ID) {
    throw new Error("TWITTER_USER_ID is not set");
  }

  /** @type import("twitter-api-v2").UserV2[] */
  const users = [];
  /** @type import("twitter-api-v2").UserV2TimelineResult */
  let usersRes = {
    data: [],
    meta: { result_count: 100, next_token: "x" },
  };

  while (usersRes.meta.next_token) {
    console.log("Getting users... " + usersRes.meta.next_token);

    // 5s timeout to avoid hitting rate limit
    await new Promise((resolve) => setTimeout(resolve, 5000));

    usersRes = await twitterClient.users(
      process.env.TWITTER_USER_ID,
      usersRes.meta.next_token === "x"
        ? {}
        : { pagination_token: usersRes.meta.next_token }
    );
    usersRes.data.forEach((user) => {
      users.push(user);
    });

    // list total
    console.log("Got " + users.length + " users");
  }

  return users;
}

async function getFollowing() {
  if (!process.env.TWITTER_USER_ID) {
    throw new Error("TWITTER_USER_ID is not set");
  }

  /** @type import("twitter-api-v2").UserV2[] */
  const following = [];
  /** @type import("twitter-api-v2").UserV2TimelineResult */
  let followingRes = {
    data: [],
    meta: { result_count: 100, next_token: "x" },
  };

  while (followingRes.meta.next_token) {
    console.log("Getting following... " + followingRes.meta.next_token);

    // 5s timeout to avoid hitting rate limit
    await new Promise((resolve) => setTimeout(resolve, 5000));

    followingRes = await twitterClient.following(
      process.env.TWITTER_USER_ID,
      followingRes.meta.next_token === "x"
        ? {}
        : { pagination_token: followingRes.meta.next_token }
    );
    followingRes.data.forEach((user) => {
      following.push(user);
    });

    // list total
    console.log("Got " + following.length + " following");
  }

  return following;
}

async function getDataForToday() {
  const date = new Date().toISOString().split("T")[0];

  const following = await getFollowing();
  await writeFile(
    `./cache/following-${date}.json`,
    JSON.stringify(following, null, 2)
  );

  const users = await getFollowers();
  await writeFile(`./cache/users-${date}.json`, JSON.stringify(users, null, 2));
}

async function compareUsers(type = "followers") {
  // get all file dates
  const fileNames = await readdir("./cache");
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
  const mostRecentFile = `./cache/${type}-${mostRecentFileDate}.json`;
  const mostRecentFileData = await readFile(mostRecentFile, "utf-8");
  /** @type import("twitter-api-v2").UserV2[] */
  const usersToday = JSON.parse(mostRecentFileData);

  // Get second most recent file
  const secondMostRecentFileDate =
    usersFileDatesSorted[usersFileDatesSorted.length - 2];
  const secondMostRecentFile = `./cache/${type}-${secondMostRecentFileDate}.json`;
  const secondMostRecentFileData = await readFile(
    secondMostRecentFile,
    "utf-8"
  );
  /** @type import("twitter-api-v2").UserV2[] */
  const usersYesterday = JSON.parse(secondMostRecentFileData);

  // Find usersYesterday not in usersToday

  const lost = usersYesterday.filter((user) => {
    return !usersToday.some((userToday) => user.id === userToday.id);
  });
  console.log(
    `Lost ${lost.length} users`,
    lost.map((user) => user.username)
  );

  // Find usersToday not in usersYesterday
  const gained = usersToday.filter((user) => {
    return !usersYesterday.some(
      (userYesterday) => user.id === userYesterday.id
    );
  });
  console.log(
    `Gained ${gained.length} users`,
    gained.map((user) => user.username)
  );
}

async function main() {
  console.log("Starting...");
  // await getDataForToday();
  // await compareUsers('followers');
  await compareUsers("following");
  console.log("Done!");
}

main();
