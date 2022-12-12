import { TwitterApi } from "twitter-api-v2";
import { config as loadEnvVariables } from "dotenv";

loadEnvVariables();

if (!process.env.TWITTER_BEARER_TOKEN) {
  throw new Error("TWITTER_BEARER_TOKEN is not set");
}

export default {
  bearer: new TwitterApi(process.env.TWITTER_BEARER_TOKEN).v2.readOnly,
  readWrite: new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY || "",
    appSecret: process.env.TWITTER_CONSUMER_SECRET || "",
    accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
    accessSecret: process.env.TWITTER_TOKEN_SECRET,
  }).v2.readWrite,
};
