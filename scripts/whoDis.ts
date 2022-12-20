import whoDis from "../utils/whoDis";

async function whoDisScript() {
  console.log("Starting...");

  await whoDis();

  console.log("Done!");
}

whoDisScript();
