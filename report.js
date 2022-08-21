import { config as loadEnvVariables } from "dotenv";
import { readdir, readFile } from "fs/promises";

loadEnvVariables();

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
  await compareUsers("followers");
  await compareUsers("following");
  console.log("Done!");
}

main();
