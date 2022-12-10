import { readdir, readFile } from "fs/promises";

/** @type {(type: 'followers'|'following') => Promise<void>} */
export default async function diffTwitterUserCaches(type = "followers") {
  console.log(`Starting diffTwitterUserCaches("${type}")...`);

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
  /** @type {import("twitter-api-v2").UserV2[]} */
  const usersCurrent = JSON.parse(mostRecentFileData);

  // Get second most recent file
  const secondMostRecentFileDate =
    usersFileDatesSorted[usersFileDatesSorted.length - 2];
  const secondMostRecentFile = `./cache/${type}-${secondMostRecentFileDate}.json`;
  const secondMostRecentFileData = await readFile(
    secondMostRecentFile,
    "utf-8"
  );
  /** @type {import("twitter-api-v2").UserV2[]} */
  const usersPrev = JSON.parse(secondMostRecentFileData);

  // Find usersPrev not in usersCurrent
  const lost = usersPrev.filter((user) => {
    return !usersCurrent.some((userCurrent) => user.id === userCurrent.id);
  });
  console.log(
    `${type === "followers" ? "Lost" : "Unfollowed"} ${lost.length} ${
      type === "followers" ? "followers" : "users"
    }.`,
    lost.map((user) => `https://twitter.com/${user.username}`)
  );

  // Find usersCurrent not in usersPrev
  const gained = usersCurrent.filter((user) => {
    return !usersPrev.some((userPrev) => user.id === userPrev.id);
  });

  return console.log(
    `${type === "followers" ? "Gained" : "Followed"} ${gained.length} ${
      type === "followers" ? "followers" : "new users"
    }.`,
    gained.map((user) => `https://twitter.com/${user.username}`)
  );
}