import cacheTwitterUsers from "./cacheTwitterUsers.js";

async function main() {
  console.log("Starting...");

  await cacheTwitterUsers("followers");
  await cacheTwitterUsers("following");

  console.log("Done!");
}

main();
