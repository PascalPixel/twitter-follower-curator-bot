import { config as loadEnvVariables } from "dotenv";
import { writeFile } from "fs/promises";
import { TwitterApi } from "twitter-api-v2";

loadEnvVariables();

if (!process.env.TWITTER_BEARER_TOKEN) {
  throw new Error("TWITTER_BEARER_TOKEN is not set");
}

const twitterClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN).v2
  .readOnly;

/** @type {(type: 'followers'|'following') => Promise<void>} */
export default async function cacheTwitterUsers(type = "followers") {
  console.log(`Starting cacheTwitterUsers("${type}")...`);

  if (!process.env.TWITTER_USER_ID) {
    throw new Error("TWITTER_USER_ID is not set");
  }

  const date = new Date().toISOString().split("T")[0];

  /** @type {import("twitter-api-v2").UserV2[]} */
  const users = [];
  /** @type {import("twitter-api-v2").UserV2TimelineResult} */
  let usersRes = {
    data: [],
    meta: { result_count: 100, next_token: "x" },
  };

  while (usersRes.meta.next_token) {
    console.log(`Getting ${type}... ` + usersRes.meta.next_token);

    // 1 call per minute to avoid hitting rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60));

    usersRes = await twitterClient[type](
      process.env.TWITTER_USER_ID,
      usersRes.meta.next_token === "x"
        ? { "user.fields": "public_metrics" }
        : {
            "user.fields": "public_metrics",
            pagination_token: usersRes.meta.next_token,
          }
    );
    usersRes.data.forEach((user) => {
      users.push(user);
    });

    // list total
    console.log("Got " + users.length + " followers");
  }

  await writeFile(
    `./cache/${type}-${date}.json`,
    JSON.stringify(users, null, 2)
  );

  return console.log(`Done cacheTwitterUsers("${type}")!`);
}