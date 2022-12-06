import diffTwitterUserCaches from "./diffTwitterUserCaches.js";
import cacheTwitterUsers from "./cacheTwitterUsers.js";
import { report2Following, report2Followers } from "./report-2.js";

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
