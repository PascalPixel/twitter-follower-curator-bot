import { readFile, writeFile } from "fs/promises";
import type { TweetV2, UserV2 } from "twitter-api-v2";

const OBAMA_TWEET_STATS = {
  impressions: 2_900_000,
  retweets: 5_522,
  quotes: 291,
  likes: 43_600,
  replies: 2_614,
};

const POINTS = {
  replies: Math.round(
    OBAMA_TWEET_STATS.impressions / OBAMA_TWEET_STATS.replies
  ),
  retweets: Math.round(
    OBAMA_TWEET_STATS.impressions / OBAMA_TWEET_STATS.retweets
  ),
  quotes: Math.round(OBAMA_TWEET_STATS.impressions / OBAMA_TWEET_STATS.quotes),
  likes: Math.round(OBAMA_TWEET_STATS.impressions / OBAMA_TWEET_STATS.likes),
  impressions: Math.round(
    OBAMA_TWEET_STATS.impressions / OBAMA_TWEET_STATS.impressions
  ),
};

async function findInfluencers() {
  const raw = await readFile("./cache/tweets.json", "utf-8");
  const userDatas: {
    response: {
      _realData: { data?: TweetV2[]; meta: { result_count: number } };
    };
    follower: UserV2;
  }[] = JSON.parse(raw);

  const results = [];
  for (const userData of userDatas) {
    const { response, follower } = userData;
    const rawTweets = response._realData.data;

    // only take users with tweets
    if (!rawTweets) continue;

    // only take users with more than 1000 followers
    if ((follower.public_metrics?.followers_count || 0) < 1000) continue;

    const tweets = rawTweets
      // only take tweets from the last 90 days
      .filter((tweet) =>
        tweet.created_at
          ? new Date(tweet.created_at) >
            new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000)
          : false
      )
      // only take tweets without RT in the text
      .filter((tweet) => !tweet.text?.includes("RT"));

    // only take users with more than 10 tweets
    if (!tweets || tweets.length < 10) continue;

    const impressions = tweets.map(
      (tweet) => tweet.public_metrics?.impression_count || 0
    );
    const likes = tweets.map((tweet) => tweet.public_metrics?.like_count || 0);
    const replies = tweets.map(
      (tweet) => tweet.public_metrics?.reply_count || 0
    );
    const retweets = tweets.map(
      (tweet) => tweet.public_metrics?.retweet_count || 0
    );
    const quotes = tweets.map(
      (tweet) => tweet.public_metrics?.quote_count || 0
    );

    const power_mean = Math.round(
      mean(impressions) * POINTS.impressions +
        mean(likes) * POINTS.likes +
        mean(replies) * POINTS.replies +
        mean(retweets) * POINTS.retweets +
        mean(quotes) * POINTS.quotes
    );
    const wormtongue_mean =
      power_mean / (follower.public_metrics?.following_count || 1);
    const proxy_mean =
      power_mean / Math.pow(follower.public_metrics?.following_count || 1, 0.5);

    const power_harmonic = Math.round(
      harmonicMean(impressions) * POINTS.impressions +
        harmonicMean(likes) * POINTS.likes +
        harmonicMean(replies) * POINTS.replies +
        harmonicMean(retweets) * POINTS.retweets +
        harmonicMean(quotes) * POINTS.quotes
    );
    const wormtongue_harmonic =
      power_harmonic / (follower.public_metrics?.following_count || 1);
    const proxy_harmonic =
      power_harmonic /
      Math.pow(follower.public_metrics?.following_count || 1, 0.5);

    const power_median = Math.round(
      median(impressions) * POINTS.impressions +
        median(likes) * POINTS.likes +
        median(replies) * POINTS.replies +
        median(retweets) * POINTS.retweets +
        median(quotes) * POINTS.quotes
    );
    const wormtongue_median =
      power_median / (follower.public_metrics?.following_count || 1);
    const proxy_median =
      power_median /
      Math.pow(follower.public_metrics?.following_count || 1, 0.5);

    const power_mode = Math.round(
      mode(impressions) * POINTS.impressions +
        mode(likes) * POINTS.likes +
        mode(replies) * POINTS.replies +
        mode(retweets) * POINTS.retweets +
        mode(quotes) * POINTS.quotes
    );
    const wormtongue_mode =
      power_mode / (follower.public_metrics?.following_count || 1);
    const proxy_mode =
      power_mode / Math.pow(follower.public_metrics?.following_count || 1, 0.5);

    if (
      isNaN(power_mean) ||
      isNaN(power_harmonic) ||
      isNaN(power_median) ||
      isNaN(power_mode) ||
      isNaN(wormtongue_mean) ||
      isNaN(wormtongue_harmonic) ||
      isNaN(wormtongue_median) ||
      isNaN(wormtongue_mode) ||
      isNaN(proxy_mean) ||
      isNaN(proxy_harmonic) ||
      isNaN(proxy_median) ||
      isNaN(proxy_mode)
    ) {
      console.log("NaN", follower.username, {
        power_mean,
        power_harmonic,
        power_median,
        power_mode,
        wormtongue_mean,
        wormtongue_harmonic,
        wormtongue_median,
        wormtongue_mode,
        proxy_mean,
        proxy_harmonic,
        proxy_median,
        proxy_mode,
      });
      continue;
    }

    results.push({
      follower,
      power_median,
      power_mean,
      power_harmonic,
      power_mode,
      wormtongue_median,
      wormtongue_mean,
      wormtongue_harmonic,
      wormtongue_mode,
      proxy_median,
      proxy_mean,
      proxy_harmonic,
      proxy_mode,
    });
  }

  // save to json file
  await writeFile(
    "./cache/influence.csv",
    [
      "url",

      "p_har",
      "p_avg",
      "p_med",
      "p_mod",

      "w_har",
      "w_avg",
      "w_med",
      "w_mod",

      "p_har",
      "p_avg",
      "p_med",
      "p_mod",
    ].join(",") +
      "\n" +
      results
        .sort((a, b) => b.power_mean - a.power_mean)
        .map((result) =>
          [
            `https://twitter.com/${result.follower.username}`,

            r2(result.power_harmonic),
            r2(result.power_mean),
            r2(result.power_median),
            r2(result.power_mode),

            r2(result.wormtongue_harmonic),
            r2(result.wormtongue_mean),
            r2(result.wormtongue_median),
            r2(result.wormtongue_mode),

            r2(result.proxy_harmonic),
            r2(result.proxy_mean),
            r2(result.proxy_median),
            r2(result.proxy_mode),
          ].join(",")
        )
        .join("\n"),
    "utf-8"
  );
}

function r2(num: number): number {
  return Math.round(num * 100) / 100;
}

function mean(numbers: number[]): number {
  let sum = 0;
  for (const num of numbers) {
    sum += num;
  }
  return sum / numbers.length;
}

function harmonicMean(numbers: number[]): number {
  let sum = 0;
  for (const num of numbers) {
    sum += 1 / num;
  }
  return numbers.length / sum;
}

function median(numbers: number[]): number {
  numbers.sort((a, b) => a - b);
  const middleIndex = Math.floor(numbers.length / 2);
  if (numbers.length % 2 === 0) {
    return (numbers[middleIndex - 1] + numbers[middleIndex]) / 2;
  }
  return numbers[middleIndex];
}

function mode(numbers: number[]): number {
  const frequency: { [key: number]: number } = {};
  for (const num of numbers) {
    if (!frequency[num]) {
      frequency[num] = 0;
    }
    frequency[num]++;
  }

  let maxFrequency = 0;
  let mode = numbers[0];
  for (const key in frequency) {
    if (frequency[key] > maxFrequency) {
      maxFrequency = frequency[key];
      mode = Number(key);
    }
  }
  return mode;
}

async function influence() {
  console.log("Starting...");

  await findInfluencers();

  console.log("Done!");
}

influence();
