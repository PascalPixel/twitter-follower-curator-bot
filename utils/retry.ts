import { TwitterApiError } from "twitter-api-v2";

export async function retry(err: unknown) {
  const error = err as TwitterApiError;
  if (error.code === 429) {
    // wait until rate limit resets
    const rateLimit = error.rateLimit || { reset: 0 };
    const resetTime = rateLimit.reset * 1000;
    const now = new Date().getTime();
    const waitTime = resetTime - now;

    // print minutes and seconds waiting
    console.log(
      `Waiting ${Math.floor(waitTime / 1000 / 60)}m ${
        Math.floor(waitTime / 1000) % 60
      }s`
    );

    // wait
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  } else if (error.code === 503) {
    console.log(`Service Unavailable, waiting 5 seconds`);

    // wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } else if (error.code === 400) {
    console.log(`Bad Request`, error);

    // wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000));
  } else {
    console.error(error);

    throw error;
  }
}
