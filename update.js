import cacheTwitterUsers from "./cacheTwitterUsers";

async function main() {
  console.log("Starting...");

  await cacheTwitterUsers("followers");
  await cacheTwitterUsers("following");

  console.log("Done!");
}

main();
