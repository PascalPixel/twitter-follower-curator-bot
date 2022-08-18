import { config } from "dotenv";
import fetch from "node-fetch";
import { writeFile } from "fs/promises";

config();

export async function getFollowers() {
  const followers = [];
  let max_results = 1000;

  async function getFollowersSet(next_token) {
    // timeout not to hammer the API
    if (next_token) await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      const id = process.env.TWITTER_USER_ID;
      const url = new URL(`https://api.twitter.com/2/users/${id}/followers`);
      url.search = new URLSearchParams(
        next_token
          ? { max_results, pagination_token: next_token }
          : { max_results }
      );

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      });
      const json = await response.json();
      if (!json.data) throw json;

      followers.push(...json.data);

      if (json.meta.next_token)
        return await getFollowersSet(json.meta.next_token);
      return console.log("done getting followers");
    } catch (err) {
      return console.log(err);
    }
  }

  await getFollowersSet();

  if (followers.length)
    writeFile("./followers.json", JSON.stringify(followers), (err) =>
      console.error(err)
    );
}

export default async function main() {
  await getFollowers();

  return console.log("done");
}

main();
