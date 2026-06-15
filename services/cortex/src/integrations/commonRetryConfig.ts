import { exponentialDelay, type RetryConfig } from '@lokalise/backend-http-client'

export const commonRetryConfig: RetryConfig = {
  retryOnTimeout: false,
  // maxRetries is retries after the initial attempt; 4 keeps the prior 5 total attempts
  maxRetries: 4,
  delay: exponentialDelay({
    baseDelayMs: 200,
  }),
}
