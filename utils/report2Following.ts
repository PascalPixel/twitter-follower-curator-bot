import { getFollowing } from "./getFollowing";
import { writeFile } from "fs/promises";

export default async function report2Following() {
  console.log("Starting...");

  const following = await getFollowing();

  const dataFollowing: [number, number, number, string][] = following.map(
    (user) => [
      user.public_metrics?.following_count || 0,
      user.public_metrics?.followers_count || 0,
      Math.round(
        parseInt(`${user.public_metrics?.followers_count || 0}`) /
          parseInt(`${user.public_metrics?.following_count || 0}`)
      ),
      `https://twitter.com/${user.username}`,
    ]
  );

  const sortedDataFollowing = dataFollowing
    .sort((a, b) => b[1] - a[1])
    .sort((a, b) => b[2] - a[2]);

  await writeFile(
    `${process.cwd()}/cache/top-following-${new Date()
      .toISOString()
      .substring(0, 10)}.json`,
    JSON.stringify(sortedDataFollowing).replace(/\],/g, "],\n")
  );

  console.log("Done!");
}
