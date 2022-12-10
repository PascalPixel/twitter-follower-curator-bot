# twitter-follower-curator-bot

## Setup

- `npm i`
- Copy `.env.example` as `.env` and add variables
  - Get API keys at [Twitter](https://developer.twitter.com/en/docs/twitter-api/getting-started/getting-access-to-the-twitter-api)
  - Find user ID using [TweeterId.com](https://tweeterid.com)
- Copy `allowlist.example.js` to `allowlist.js` and add more people to exclude from the unfollow command

## Usage

- `npm start`
- You will find a `followers-YYYY-MM-DD.json` and a `following-YYYY-MM-DD.json` in the `cache` folder.
- You will find a `top-followers-YYYY-MM-DD.json` and a `top-following-YYYY-MM-DD.json` in the `cache` folder.

## Unfollow

- `npm run unfollow` will unfollow users with a followers/following ratio of less than `1`.
