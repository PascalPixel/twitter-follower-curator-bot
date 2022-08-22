import diffTwitterUserCaches from "./diffTwitterUserCaches.js";

async function main() {
  console.log("Starting...");

  await diffTwitterUserCaches("followers");
  await diffTwitterUserCaches("following");

  console.log("Done!");
}

main();
