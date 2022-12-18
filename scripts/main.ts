import diffTwitterUserCaches from "../utils/diffTwitterUserCaches";
import cacheTwitterUsers from "../utils/cacheTwitterUsers";
import makeReport from "../utils/makeReport";

async function main() {
  console.log("Starting...");

  await cacheTwitterUsers("followers");
  await cacheTwitterUsers("following");

  await diffTwitterUserCaches("followers");
  await diffTwitterUserCaches("following");

  await makeReport("following");
  await makeReport("followers");

  console.log("Done!");
}

main();
