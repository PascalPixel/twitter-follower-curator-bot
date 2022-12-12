import diffTwitterUserCaches from "../utils/diffTwitterUserCaches";

async function difference() {
  console.log("Starting...");

  await diffTwitterUserCaches("followers");
  await diffTwitterUserCaches("following");

  console.log("Done!");
}

difference();
