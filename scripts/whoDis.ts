import whoDis from "../utils/whoDis";
import advice from "../utils/advice";

async function whoDisScript() {
  console.log("Starting...");

  await whoDis();

  await advice();

  console.log("Done!");
}

whoDisScript();
