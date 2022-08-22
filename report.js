import diffTwitterUserCaches from "./diffTwitterUserCaches";

async function main() {
  console.log("Starting...");

  await diffTwitterUserCaches("followers");
  await diffTwitterUserCaches("following");

  console.log("Done!");
}

main();
