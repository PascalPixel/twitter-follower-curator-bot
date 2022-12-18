import { writeFile } from "fs/promises";
import { TwitterApiError, UserV2, UserV2TimelineResult } from "twitter-api-v2";
import twitterClient from "../lib/twitterClient";

export default async function cacheTwitterUsers(
  type: "followers" | "following" = "followers"
): Promise<void> {
  console.log(`Starting cacheTwitterUsers("${type}")...`);

  if (!process.env.TWITTER_USER_ID) {
    throw new Error("TWITTER_USER_ID is not set");
  }

  const date = new Date().toISOString().split("T")[0];

  const users: UserV2[] = [];
  let usersRes: UserV2TimelineResult = {
    data: [],
    meta: { result_count: 100, next_token: "x" },
  };

  while (usersRes.meta.next_token) {
    console.log(`Getting ${type}... ` + usersRes.meta.next_token);

    try {
      usersRes = await twitterClient.bearer[type](
        process.env.TWITTER_USER_ID,
        usersRes.meta.next_token === "x"
          ? { "user.fields": "public_metrics", max_results: 1000 }
          : {
              "user.fields": "public_metrics",
              max_results: 1000,
              pagination_token: usersRes.meta.next_token,
            }
      );
      usersRes.data.forEach((user) => {
        users.push(user);
      });

      // list total
      console.log("Got " + users.length + " " + type + ".");
    } catch (err) {
      // TwitterApiError
      const error = err as TwitterApiError;
      if (error.code === 429) {
        // wait until rate limit resets
        const rateLimit = error.rateLimit || { reset: 0 };
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
      } else {
        throw error;
      }
    }
  }

  await writeFile(
    `${process.cwd()}/cache/${type}-${date}.json`,
    JSON.stringify(users, null, 2)
  );

  return console.log(`Done cacheTwitterUsers("${type}")!`);
}
