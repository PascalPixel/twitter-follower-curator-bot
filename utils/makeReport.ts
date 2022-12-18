import { writeFile } from "fs/promises";

import { getFollowing } from "./getFollowing";
import { getFollowers } from "./getFollowers";

export default async function makeReport(type: "following" | "followers") {
  console.log("Starting...");

  const users =
    type === "followers" ? await getFollowers() : await getFollowing();

  const dataUsers: [number, number, number, string][] = users.map((user) => [
    user.public_metrics?.following_count || 0,
    user.public_metrics?.followers_count || 0,
    Math.round(
      parseInt(`${user.public_metrics?.followers_count || 0}`) /
        parseInt(`${user.public_metrics?.following_count || 0}`)
    ),
    `https://twitter.com/${user.username}`,
  ]);

  const sortedFilteredDataFollowers = dataUsers
    .sort((a, b) => b[1] - a[1])
    .sort((a, b) => b[2] - a[2]);

  await writeFile(
    `${process.cwd()}/cache/top-${type}-${new Date()
      .toISOString()
      .substring(0, 10)}.json`,
    JSON.stringify(sortedFilteredDataFollowers).replace(/\],/g, "],\n")
  );

  console.log("Done!");
}
