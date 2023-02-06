import { readdir, readFile } from "fs/promises";
import { UserV2 } from "twitter-api-v2";

export default async function diffTwitterUserCaches(
  type: "followers" | "following" = "followers"
): Promise<void> {
  console.log(`Starting diffTwitterUserCaches("${type}")...`);

  try {
    // get all file dates
    const fileNames = await readdir(`${process.cwd()}/cache`);
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
    const mostRecentFile = `${process.cwd()}/cache/${type}-${mostRecentFileDate}.json`;
    const mostRecentFileData = await readFile(mostRecentFile, "utf-8");
    const usersCurrent: UserV2[] = JSON.parse(mostRecentFileData);

    // Get second most recent file
    const secondMostRecentFileDate =
      usersFileDatesSorted[usersFileDatesSorted.length - 2];
    const secondMostRecentFile = `${process.cwd()}/cache/${type}-${secondMostRecentFileDate}.json`;
    const secondMostRecentFileData = await readFile(
      secondMostRecentFile,
      "utf-8"
    );
    const usersPrev: UserV2[] = JSON.parse(secondMostRecentFileData);

    // Find usersPrev not in usersCurrent
    const lost = usersPrev.filter((user: { id: any }) => {
      return !usersCurrent.some(
        (userCurrent: { id: any }) => user.id === userCurrent.id
      );
    });
    console.log(
      `${type === "followers" ? "Lost" : "Unfollowed"} ${lost.length} ${
        type === "followers" ? "followers" : "users"
      }.`,
      lost.map(
        (user: { username: any }) => `https://twitter.com/${user.username}`
      )
    );

    // Find usersCurrent not in usersPrev
    const gained = usersCurrent.filter((user: { id: any }) => {
      return !usersPrev.some(
        (userPrev: { id: any }) => user.id === userPrev.id
      );
    });

    return console.log(
      `${type === "followers" ? "Gained" : "Followed"} ${gained.length} ${
        type === "followers" ? "followers" : "new users"
      }.`,
      gained.map(
        (user: { username: any }) => `https://twitter.com/${user.username}`
      )
    );
  } catch (error) {
    console.error("Likely no previous cache file to compare to.");
  }
}
