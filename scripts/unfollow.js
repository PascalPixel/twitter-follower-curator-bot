import unfollowUsers from "../utils/unfollowUsers.js";

async function unfollow() {
  console.log("Starting...");

  await unfollowUsers();

  console.log("Done!");
}

unfollow();
