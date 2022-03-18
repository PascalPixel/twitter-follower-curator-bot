import { config } from "dotenv";
import fetch from "node-fetch";
import { writeFile } from "fs/promises";

config();

async function main() {
  const followers = [];
  let max_results = 1000;

  async function getFollowers(next_token) {
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

      if (json.meta.next_token) return await getFollowers(json.meta.next_token);
      return console.log("done getting followers");
    } catch (err) {
      return console.log(err);
    }
  }

  await getFollowers();

  if (followers.length)
    writeFile("./followers.json", JSON.stringify(followers), (err) =>
      console.error(err)
    );

  return console.log("done");
}

main();
