import { getFollowers } from "./getFollowers";
import { getFollowing } from "./getFollowing";

async function ratioFilter(followers: number, following: number) {
  return (
    (await getFollowers())
      // has a large following
      .filter(
        (follower) =>
          (follower.public_metrics?.followers_count || 0) > followers
      )
      // pays attention to whom they follow
      .filter(
        (follower) =>
          (follower.public_metrics?.following_count || 0) < following
      )
      // sort by followers
      .sort((a, b) => {
        return (
          (b.public_metrics?.followers_count || 0) -
          (a.public_metrics?.followers_count || 0)
        );
      })
  );
}

export default async function whoDis() {
  const followers = await getFollowers();
  const following = await getFollowing();
  const followingUsernames = following.map((user) => user.username);

  console.log("");
  console.log("Interact with these people:");
  const previousUsersA = new Set();
  [
    await ratioFilter(50000, 500),
    await ratioFilter(50000, 1000),
    await ratioFilter(50000, 4000),
  ]
    // Loop through each array of followers
    .forEach((followers) => {
      followers
        // Filter out the users that are in the previousUsersA Set
        .filter((user) => !previousUsersA.has(user.username))

        // Map the remaining users to an array with their username, followers count, following count, and ratio
        .map((user) => {
          // Add the username to the previousUsersA Set
          previousUsersA.add(user.username);

          // log
          console.log(
            `https://twitter.com/${user.username}`,
            user.public_metrics?.followers_count,
            user.public_metrics?.following_count
          );
        });
    });

  console.log("");
  console.log("Follow these people:");
  const previousUsers = new Set();
  [
    await ratioFilter(10000, 500),
    await ratioFilter(10000, 1000),
    await ratioFilter(10000, 4000),
  ]
    // Loop through each array of followers
    .forEach((followers) => {
      followers
        // Filter out the users that are in the previousUsers Set
        .filter((user) => !previousUsers.has(user.username))

        // Filter if I am not following them
        .filter((user) => !followingUsernames.includes(user.username))

        // Map the remaining users to an array with their username, followers count, following count, and ratio
        .map((user) => {
          // Add the username to the previousUsers Set
          previousUsers.add(user.username);

          // log
          console.log(
            `https://twitter.com/${user.username}`,
            user.public_metrics?.followers_count,
            user.public_metrics?.following_count
          );
        });
    });

  console.log("");
  console.log("Target or unfollow these people:");
  following
    .filter((user) => (user.public_metrics?.followers_count || 0) >= 10000)
    .filter(
      (user) =>
        !followers.map((follower) => follower.username).includes(user.username)
    )
    .sort(
      (a, b) =>
        (b.public_metrics?.followers_count || 1) -
        (a.public_metrics?.followers_count || 1)
    )
    .map((user) =>
      console.log(
        `https://twitter.com/${user.username}`,
        user.public_metrics?.followers_count,
        user.public_metrics?.following_count
      )
    );

  console.log("");
  console.log("Unfollow these people:");
  // everyone with less than 10k followers
  following
    .filter((user) => (user.public_metrics?.followers_count || 0) < 10000)
    .sort(
      (a, b) =>
        (b.public_metrics?.followers_count || 1) -
        (a.public_metrics?.followers_count || 1)
    )
    .map((user) =>
      console.log(
        `https://twitter.com/${user.username}`,
        user.public_metrics?.followers_count,
        user.public_metrics?.following_count
      )
    );
}
