import { getFollowers } from "./getFollowers";

export default async function whoDis() {
  const allFollowers = await getFollowers();

  const bigFish = [...allFollowers]
    .sort((a, b) => {
      // sort by followers
      return (
        (b.public_metrics?.followers_count || 0) -
        (a.public_metrics?.followers_count || 0)
      );
    })
    .slice(0, 10);

  const greatRatio = [...allFollowers]
    .filter(
      // has a large following
      (follower) => (follower.public_metrics?.followers_count || 0) > 10000
    )
    .filter(
      // pays attention to whom they follow
      (follower) => (follower.public_metrics?.following_count || 0) < 2000
    )
    .filter(
      // stellar ratio
      (follower) =>
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        ) > 100
    )
    .sort((a, b) => {
      // sort by followers
      return (
        (b.public_metrics?.followers_count || 0) -
        (a.public_metrics?.followers_count || 0)
      );
    });

  const greatPeeps = [...allFollowers]
    .filter(
      // has a decent following
      (follower) => (follower.public_metrics?.followers_count || 0) > 10000
    )
    .filter(
      // pays attention to whom they follow
      (follower) => (follower.public_metrics?.following_count || 0) < 2000
    )
    .filter(
      // remove bad ratio
      (follower) =>
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        ) > 20
    )
    .sort((a, b) => {
      // sort by followers
      return (
        (b.public_metrics?.followers_count || 0) -
        (a.public_metrics?.followers_count || 0)
      );
    });

  const goodPeeps = [...allFollowers]
    .filter(
      // has a decent following
      (follower) => (follower.public_metrics?.followers_count || 0) > 10000
    )
    .filter(
      // pays attention to whom they follow
      (follower) => (follower.public_metrics?.following_count || 0) < 2000
    )
    .filter(
      // remove bad ratio
      (follower) =>
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        ) > 5
    )
    .sort((a, b) => {
      // sort by followers
      return (
        (b.public_metrics?.followers_count || 0) -
        (a.public_metrics?.followers_count || 0)
      );
    });

  const groups = [bigFish, greatRatio, greatPeeps, goodPeeps];

  groups.forEach((followers) => {
    console.table(
      followers.map((follower) => [
        follower.username,
        follower.public_metrics?.followers_count,
        follower.public_metrics?.following_count,
        Math.round(
          (follower.public_metrics?.followers_count || 0) /
            (follower.public_metrics?.following_count || 1)
        ),
      ])
    );
  });
}
