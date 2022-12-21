"use strict";
exports.__esModule = true;
var twitter_api_v2_1 = require("twitter-api-v2");
var dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
if (!process.env.TWITTER_BEARER_TOKEN) {
    throw new Error("TWITTER_BEARER_TOKEN is not set");
}
exports["default"] = {
    bearer: new twitter_api_v2_1.TwitterApi(process.env.TWITTER_BEARER_TOKEN).v2.readOnly,
    readWrite: new twitter_api_v2_1.TwitterApi({
        appKey: process.env.TWITTER_CONSUMER_KEY || "",
        appSecret: process.env.TWITTER_CONSUMER_SECRET || "",
        accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
        accessSecret: process.env.TWITTER_TOKEN_SECRET
    }).v2.readWrite
};
