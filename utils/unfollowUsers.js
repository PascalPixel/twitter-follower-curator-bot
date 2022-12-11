import { readFile, readdir } from "fs/promises";
import allowlist from "../allowlist.js";
import twitterClient from "../lib/twitterClient.js";
import { getFollowers } from "./getFollowers.js";

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
  const mostRecentFile = `./cache/${type}-${mostRecentFileDate}.json`;
  const mostRecentFileData = await readFile(mostRecentFile, "utf-8");

  /** @type {[number,number,number,string][]} */
  const users = JSON.parse(mostRecentFileData);

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
        continue;
      } else if (followersHandles.includes(id)) {
        console.log(`Skipping ${id} because they are a follower`);
        continue;
      } else {
        // wait 1 second between each unfollow
        await new Promise((resolve) => setTimeout(resolve, 2000));
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
