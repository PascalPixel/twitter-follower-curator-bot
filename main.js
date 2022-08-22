import diffTwitterUserCaches from "./diffTwitterUserCaches.js";
import cacheTwitterUsers from "./cacheTwitterUsers.js";

async function main() {
  console.log("Starting...");

  await cacheTwitterUsers("followers");
  await cacheTwitterUsers("following");

  await diffTwitterUserCaches("followers");
  await diffTwitterUserCaches("following");

  console.log("Done!");
}

main();
