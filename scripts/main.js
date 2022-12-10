import diffTwitterUserCaches from "../utils/diffTwitterUserCaches.js";
import cacheTwitterUsers from "../utils/cacheTwitterUsers.js";
import report2Followers from "../utils/report2Followers.js";
import report2Following from "../utils/report2Following.js";

async function main() {
  console.log("Starting...");

  await cacheTwitterUsers("followers");
  await cacheTwitterUsers("following");

  await diffTwitterUserCaches("followers");
  await diffTwitterUserCaches("following");

  await report2Following();
  await report2Followers();

  console.log("Done!");
}

main();
