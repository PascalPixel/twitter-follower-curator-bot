import { getFollowers } from "./getFollowers.js";
import { writeFile } from "fs/promises";

// find followers with highest ratio
export default async function report2Followers() {
  console.log("Starting...");

  const followers = await getFollowers();

  const dataFollowers = followers.map((user) => [
    user.public_metrics?.following_count,
    user.public_metrics?.followers_count,
    Math.round(
      parseInt(`${user.public_metrics?.followers_count || 0}`) /
        parseInt(`${user.public_metrics?.following_count || 0}`)
    ),
    `https://twitter.com/${user.username}`,
  ]);

  const sortedFilteredDataFollowers = dataFollowers
    .sort((a, b) => b[1] - a[1])
    .sort((a, b) => b[2] - a[2]);

  await writeFile(
    `./cache/top-followers-${new Date().toISOString().substring(0, 10)}.json`,
    JSON.stringify(sortedFilteredDataFollowers).replace(/\],/g, "],\n")
  );

  console.log("Done!");
}
