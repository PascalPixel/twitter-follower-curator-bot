import likeLastTweet from "../utils/likeLastTweet";

async function activeCount() {
  console.log("Starting...");

  await likeLastTweet();

  console.log("Done!");
}

activeCount();
