import { writeFile } from "fs/promises";
import { UserV2, UserV2TimelineResult } from "twitter-api-v2";
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

    // 1 call per minute to avoid hitting rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60));
  }

  await writeFile(`./cache/${type}-${date}on`, JSON.stringify(users, null, 2));

  return console.log(`Done cacheTwitterUsers("${type}")!`);
}
