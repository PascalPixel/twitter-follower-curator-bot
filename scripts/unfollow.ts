import unfollowUsers from "../utils/unfollowUsers";

async function unfollow() {
  console.log("Starting...");

  await unfollowUsers();

  console.log("Done!");
}

unfollow();
