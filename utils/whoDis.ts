import { getFollowers } from "./getFollowers";

export default async function whoDis() {
  const allFollowers = await getFollowers();

  // log a big line
  console.log("--------------------------------------------------");

  const goodFollowers = [...allFollowers]
    .filter(
      // following me 10k+ followers
      (follower) => (follower.public_metrics?.followers_count || 0) > 10000
    )
    .filter(
      // Remove if they follow more than 2000 people
      (follower) => (follower.public_metrics?.following_count || 0) < 2000
    )
    .filter(
      // remove if their ratio is less than 1
      (follower) =>
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        ) > 5
    )
    .sort((a, b) => {
      // sort by followers
      const aFollowers = a.public_metrics?.followers_count || 0;
      const bFollowers = b.public_metrics?.followers_count || 0;
      return bFollowers - aFollowers;
    })
    .map((follower) => {
      // print
      console.log(
        follower.username,
        "\t",
        follower.public_metrics?.followers_count,
        "\t",
        follower.public_metrics?.following_count,
        "\t",
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        )
      );

      return follower;
    });

  // log a big line
  console.log("--------------------------------------------------");

  const otherFollowers = [...allFollowers]
    .filter((follower) => {
      // not in good followers
      return !goodFollowers.includes(follower);
    })
    .filter(
      // following me 10k+ followers
      (follower) => (follower.public_metrics?.followers_count || 0) > 10000
    )
    .filter(
      // Remove if they follow more than 5000 people
      (follower) => (follower.public_metrics?.following_count || 0) < 5000
    )
    .filter(
      // remove if their ratio is less than 1
      (follower) =>
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        ) > 5
    )
    .sort((a, b) => {
      // sort by followers
      const aFollowers = a.public_metrics?.followers_count || 0;
      const bFollowers = b.public_metrics?.followers_count || 0;
      return bFollowers - aFollowers;
    })
    .map((follower) => {
      // print
      console.log(
        follower.username,
        "\t",
        follower.public_metrics?.followers_count,
        "\t",
        follower.public_metrics?.following_count,
        "\t",
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        )
      );

      return follower;
    });

  // log a big line
  console.log("--------------------------------------------------");

  const restFollowers = [...allFollowers]
    .filter((follower) => {
      // not in good followers
      return !goodFollowers.includes(follower);
    })
    .filter((follower) => {
      // not in other followers
      return !otherFollowers.includes(follower);
    })
    .filter(
      // following me 10k+ followers
      (follower) => (follower.public_metrics?.followers_count || 0) > 1000
    )
    .filter(
      // Remove if they follow more than 5000 people
      (follower) => (follower.public_metrics?.following_count || 0) < 2000
    )
    .filter(
      // remove if their ratio is less than 1
      (follower) =>
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        ) > 5
    )
    .sort((a, b) => {
      // sort by followers
      const aFollowers = a.public_metrics?.followers_count || 0;
      const bFollowers = b.public_metrics?.followers_count || 0;
      return bFollowers - aFollowers;
    })
    .map((follower) => {
      // print
      console.log(
        follower.username,
        "\t",
        follower.public_metrics?.followers_count,
        "\t",
        follower.public_metrics?.following_count,
        "\t",
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        )
      );

      return follower;
    });

  // log a big line
  console.log("--------------------------------------------------");

  const whomeverLeftFollowers = [...allFollowers]
    .filter((follower) => {
      // not in good followers
      return !goodFollowers.includes(follower);
    })
    .filter((follower) => {
      // not in other followers
      return !otherFollowers.includes(follower);
    })
    .filter((follower) => {
      // not in rest followers
      return !restFollowers.includes(follower);
    })
    .filter(
      // following me 10k+ followers
      (follower) => (follower.public_metrics?.followers_count || 0) > 10000
    )
    .filter(
      // remove if their ratio is less than 1
      (follower) =>
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        ) > 5
    )
    .sort((a, b) => {
      // sort by followers
      const aFollowers = a.public_metrics?.followers_count || 0;
      const bFollowers = b.public_metrics?.followers_count || 0;
      return bFollowers - aFollowers;
    })
    .map((follower) => {
      // print
      console.log(
        follower.username,
        "\t",
        follower.public_metrics?.followers_count,
        "\t",
        follower.public_metrics?.following_count,
        "\t",
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        )
      );

      return follower;
    });

  // log a big line
  console.log("--------------------------------------------------");
}
