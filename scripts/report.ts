import makeReport from "../utils/makeReport";

async function report() {
  console.log("Starting...");

  await makeReport("following");
  await makeReport("followers");

  console.log("Done!");
}

report();
