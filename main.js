import { config as loadEnvVariables } from "dotenv";
import { writeFile } from "fs/promises";
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
    meta: { result_count: 100, next_token: undefined },
  };

  while (followersRes.meta.next_token) {
    followersRes = await twitterClient.followers(
      process.env.TWITTER_USER_ID,
      followersRes.meta.next_token !== undefined
        ? {}
        : { pagination_token: followersRes.meta.next_token }
    );
    followersRes.data.forEach((user) => {
      followers.push(user);
    });
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
    meta: { result_count: 100, next_token: undefined },
  };

  while (followingRes.meta.next_token) {
    followingRes = await twitterClient.following(
      process.env.TWITTER_USER_ID,
      followingRes.meta.next_token !== undefined
        ? {}
        : { pagination_token: followingRes.meta.next_token }
    );
    followingRes.data.forEach((user) => {
      following.push(user);
    });
  }

  return following;
}

async function main() {
  const following = await getFollowing();
  await writeFile("./following.json", JSON.stringify(following, null, 2));

  const followers = await getFollowers();
  await writeFile("./followers.json", JSON.stringify(followers, null, 2));
}

main();
