import analyzeActives from "../utils/analyzeActives";

async function activeCount() {
  console.log("Starting...");

  await analyzeActives();

  console.log("Done!");
}

activeCount();
