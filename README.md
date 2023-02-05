# twitter-follower-curator-bot

My Twitter account is very old and I'm trying re-active it. It also seemed to be infested with a lot of bots from ~2012. I started with 14k followers and 10k following. I wrote these scripts to decide who I could unfollow from these old accounts, and who I could force to unfollow me (block/unblock=unfollow) in an attempt to get more recently active people to see my content.

## Setup

- `pnpm i`
- Copy `.env.example` as `.env` and add variables
  - Get API keys at [Twitter](https://developer.twitter.com/en/docs/twitter-api/getting-started/getting-access-to-the-twitter-api)
  - Find user ID using [TweeterId.com](https://tweeterid.com)
- Copy `allowlist.example.json` to `allowlist.json` and add more people to exclude from the unfollow command

## Usage

### Getting your current following and followers lists

- `pnpm run start`
- You will find a `followers-YYYY-MM-DD.json` and a `following-YYYY-MM-DD.json` in the `cache` folder.
- It will report the difference compared to the last day you have in your cache, listing who you followed, unfollowed, and who followed, or unfollowed you

### Auto-unfollowing

- `pnpm run unfollow` will start the script
- **onAllowlist** Users on the `allowlist.json` are skipped
- **isFollower** Users who follow you are skipped
- **isUnderground** Users who have more than a ratio of 1:2 followers to following & less than 10k followers are skipped
- **isPopular** Users who have more than a ratio of 1:20 followers to following & more than 10k followers are skipped
- **isBot** If a user follows more than 4k people (they are not actually engaging), or has less than 100 followers, or has a ratio less than 1:1

### Force users to unfollow you

- `pnpm run beta:tweets` gets the latest 100 tweets from everyone who follows you
- `pnpm run beta:blockBots` blocks & unblocks everyone (forcing them to unfollow you) who hasn't tweeted in 5 years, has [less than 10 tweets & 10 followers & 10 following], has never tweeted, or has protected their tweets from being read
