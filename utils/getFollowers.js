import { readdir, readFile } from "fs/promises";

export async function getFollowers() {
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
