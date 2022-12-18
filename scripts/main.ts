import diffTwitterUserCaches from "../utils/diffTwitterUserCaches";
import cacheTwitterUsers from "../utils/cacheTwitterUsers";

async function main() {
  console.log("Starting...");

  await cacheTwitterUsers("followers");
  await cacheTwitterUsers("following");

  await diffTwitterUserCaches("followers");
  await diffTwitterUserCaches("following");

  console.log("Done!");
}

main();
