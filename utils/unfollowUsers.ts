import { readFile, readdir } from "fs/promises";
import allowlist from "../allowlist.json";
import twitterClient from "../lib/twitterClient";

export default async function unfollowUsers(type = "top-following") {
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
  const mostRecentFile = `./cache/${type}-${mostRecentFileDate}on`;
  const mostRecentFileData = await readFile(mostRecentFile, "utf-8");

  const mostRecentFileDataParsed: [number, number, number, string][] =
    JSON.parse(mostRecentFileData);

  // reverse order
  const mostRecentFileDataParsedReversed = [
    ...mostRecentFileDataParsed,
  ].reverse();

  // filter for only users with a ratio of 1 or less
  const mostRecentFileDataParsedReversedFiltered =
    mostRecentFileDataParsedReversed.filter(
      ([following_count, followers_count, ratio]) => ratio <= 1
    );

  // get ids
  const lowest100Ids = mostRecentFileDataParsedReversedFiltered.map(
    ([following_count, followers_count, ratio, linkToProfile]) =>
      linkToProfile.split("/")[3]
  );

  // unfollow unless in allowlist
  for (const id of lowest100Ids) {
    // wait 1 second between each unfollow
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // if user is in allowlist, skip
      if (allowlist.includes(id)) {
        console.log(`Skipping ${id} because they are in the allowlist`);
        continue;
      } else {
        // get user ID from username
        const user = await twitterClient.readWrite.userByUsername(id);
        await twitterClient.readWrite.unfollow(
          process.env.TWITTER_USER_ID || "",
          user.data.id
        );
        console.log(`Unfollowed ${id}`);
      }
    } catch (e) {
      console.log(`Error unfollowing ${id}`, e);
      // if rateLimit
      if (e.message.includes("429")) {
        // wait until rate limit resets
        const rateLimit = e.rateLimit;
        const resetTime = rateLimit.reset * 1000;
        const now = new Date().getTime();
        const waitTime = resetTime - now;

        // print minutes and seconds waiting
        console.log(
          `Waiting ${Math.floor(waitTime / 1000 / 60)}m ${
            Math.floor(waitTime / 1000) % 60
          }s`
        );

        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        break;
      }
    }
  }
}
