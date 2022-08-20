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
  const followers = [];
  /** @type import("twitter-api-v2").UserV2TimelineResult */
  let followersRes = {
    data: [],
    meta: { result_count: 100, next_token: "x" },
  };

  while (followersRes.meta.next_token) {
    console.log("Getting followers... " + followersRes.meta.next_token);

    // 1 call per minute to avoid hitting rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60));

    followersRes = await twitterClient.followers(
      process.env.TWITTER_USER_ID,
      followersRes.meta.next_token === "x"
        ? { "user.fields": "public_metrics" }
        : {
            "user.fields": "public_metrics",
            pagination_token: followersRes.meta.next_token,
          }
    );
    followersRes.data.forEach((user) => {
      followers.push(user);
    });

    // list total
    console.log("Got " + followers.length + " followers");
  }

  return followers;
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

    // 1 call per minute to avoid hitting rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60));

    followingRes = await twitterClient.following(
      process.env.TWITTER_USER_ID,
      followingRes.meta.next_token === "x"
        ? { "user.fields": "public_metrics" }
        : {
            "user.fields": "public_metrics",
            pagination_token: followingRes.meta.next_token,
          }
    );
    followingRes.data.forEach((user) => {
      following.push(user);
    });

    // list total
    console.log("Got " + following.length + " following");
  }

  return following;
}

async function getDataForCurrent() {
  const date = new Date().toISOString().split("T")[0];

  const following = await getFollowing();
  await writeFile(
    `./cache/following-${date}.json`,
    JSON.stringify(following, null, 2)
  );

  const followers = await getFollowers();
  await writeFile(
    `./cache/followers-${date}.json`,
    JSON.stringify(followers, null, 2)
  );
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
  const usersCurrent = JSON.parse(mostRecentFileData);

  // Get second most recent file
  const secondMostRecentFileDate =
    usersFileDatesSorted[usersFileDatesSorted.length - 2];
  const secondMostRecentFile = `./cache/${type}-${secondMostRecentFileDate}.json`;
  const secondMostRecentFileData = await readFile(
    secondMostRecentFile,
    "utf-8"
  );
  /** @type import("twitter-api-v2").UserV2[] */
  const usersPrev = JSON.parse(secondMostRecentFileData);

  // Find usersPrev not in usersCurrent
  const lost = usersPrev.filter((user) => {
    return !usersCurrent.some((userCurrent) => user.id === userCurrent.id);
  });
  console.log(
    `Lost ${lost.length} users`,
    lost.map((user) => user.username)
  );

  // Find usersCurrent not in usersPrev
  const gained = usersCurrent.filter((user) => {
    return !usersPrev.some((userPrev) => user.id === userPrev.id);
  });
  console.log(
    `Gained ${gained.length} users`,
    gained.map((user) => user.username)
  );
}

async function main() {
  console.log("Starting...");
  await getDataForCurrent();
  await compareUsers("followers");
  await compareUsers("following");
  console.log("Done!");
}

main();
