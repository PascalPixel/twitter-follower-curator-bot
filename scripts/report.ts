import report2Followers from "../utils/report2Followers";
import report2Following from "../utils/report2Following";

async function report() {
  console.log("Starting...");

  await report2Following();
  await report2Followers();

  console.log("Done!");
}

report();
