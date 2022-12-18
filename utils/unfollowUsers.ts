import { readFile, readdir } from "fs/promises";
import twitterClient from "../lib/twitterClient";
import { getFollowers } from "./getFollowers";

export default async function unfollowUsers(type = "top-following") {
  // import allowlist
  const allowlistRaw = await readFile(
    `${process.cwd()}/allowlist.json`,
    "utf-8"
  );
  const allowlist: string[] = JSON.parse(allowlistRaw);

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

  const users: [number, number, number, string][] =
    JSON.parse(mostRecentFileData);

  // sort by followers, ascending
  const sortedUsers = users.sort(
    (
      [a_following_count, a_followers_count, a_ratio],
      [b_following_count, b_followers_count, b_ratio]
    ) => {
      return a_followers_count - b_followers_count;
    }
  );

  // get ids
  const followingHandles = sortedUsers.map(
    ([following_count, followers_count, ratio, linkToProfile]) =>
      linkToProfile.split("/")[3]
  );

  // get followers
  const followers = await getFollowers();
  const followersHandles = followers.map((follower) => follower.username);

  // unfollow unless in allowlist
  for (const id of followingHandles) {
    try {
      // if user is in allowlist, skip
      if (allowlist.includes(id)) {
        console.log(`Skipping ${id} because they are in the allowlist`);
        return;
      }

      // if user is a follower, skip
      if (followersHandles.includes(id)) {
        console.log(`Skipping ${id} because they are a follower`);
        return;
      }

      // get user ID from username
      const user = await twitterClient.readWrite.userByUsername(id);

      // unfollow (50 per 15 minutes)
      await twitterClient.readWrite.unfollow(
        process.env.TWITTER_USER_ID || "",
        user.data.id
      );

      // Success
      console.log(`Unfollowed ${id}`);
    } catch (e: any) {
      console.log(`Error unfollowing ${id}`);
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
        console.error(e);
        break;
      }
    }
  }
}
