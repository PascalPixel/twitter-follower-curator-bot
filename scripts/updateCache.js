import cacheTwitterUsers from "../utils/cacheTwitterUsers.js";

async function update() {
  console.log("Starting...");

  await cacheTwitterUsers("followers");
  await cacheTwitterUsers("following");

  console.log("Done!");
}

update();
