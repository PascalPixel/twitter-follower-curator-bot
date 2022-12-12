import diffTwitterUserCaches from "../utils/diffTwitterUserCaches";
import cacheTwitterUsers from "../utils/cacheTwitterUsers";
import report2Followers from "../utils/report2Followers";
import report2Following from "../utils/report2Following";

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
