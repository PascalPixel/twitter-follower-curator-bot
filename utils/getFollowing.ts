import { readdir, readFile } from "fs/promises";
import { UserV2 } from "twitter-api-v2";

export async function getFollowing() {
  const fileNames = await readdir("./cache");
  // find file with latest date
  const followingFileNames = fileNames.filter((fileName) =>
    fileName.includes("following-")
  );
  const followingFileDates = followingFileNames.map(
    (fileName) => fileName.split("following-")[1].split(".")[0]
  );
  const followingFileDatesSorted = followingFileDates.sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  const mostRecentFileDate =
    followingFileDatesSorted[followingFileDatesSorted.length - 1];
  const mostRecentFile = `./cache/following-${mostRecentFileDate}on`;
  const mostRecentFileData = await readFile(mostRecentFile, "utf-8");

  const users: UserV2[] = JSON.parse(mostRecentFileData);

  return users;
}
