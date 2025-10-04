# Scheduled Jobs

This directory contains scheduled background jobs that run periodically using node-cron.

## Exchange Rate Job

### Purpose
Automatically fetches and caches exchange rates for all company currencies to ensure up-to-date conversion rates are available.

### Schedule
- Default: Daily at 2:00 AM (server timezone)
- Configurable via `EXCHANGE_RATE_CRON` environment variable

### Configuration

#### Environment Variables

**EXCHANGE_RATE_CRON**
- Cron expression for scheduling the job
- Default: `0 2 * * *` (daily at 2 AM)
- Examples:
  - `0 */6 * * *` - Every 6 hours
  - `0 0 * * 0` - Weekly on Sunday at midnight
  - `*/30 * * * *` - Every 30 minutes

**TZ**
- Timezone for cron job execution
- Default: `UTC`
- Examples: `America/New_York`, `Europe/London`, `Asia/Tokyo`

### How It Works

1. Queries all companies in the database
2. Extracts unique default currencies
3. For each currency:
   - Fetches latest exchange rates from Exchange Rate API
   - Caches rates in the database
   - Logs success or failure
4. Provides summary of successful and failed updates

### Logging

The job logs the following information:
- Start time and currencies to update
- Success/failure for each currency
- Total execution time
- Summary of results

Example log output:
```
[Exchange Rate Job] Starting scheduled exchange rate update...
[Exchange Rate Job] Found 3 unique currencies to update: USD, EUR, GBP
[Exchange Rate Job] ✓ Updated 150 rates for USD
[Exchange Rate Job] ✓ Updated 150 rates for EUR
[Exchange Rate Job] ✓ Updated 150 rates for GBP
[Exchange Rate Job] Completed in 1234ms
[Exchange Rate Job] Summary: 3 successful, 0 failed
```

### Manual Trigger

You can manually trigger an exchange rate update using the exported function:

```javascript
const { runExchangeRateUpdateNow } = require('./jobs/exchangeRateJob');

// Trigger immediate update
const results = await runExchangeRateUpdateNow();
console.log(results);
// {
//   successful: [{ currency: 'USD', ratesCount: 150, cachedCount: 150 }],
//   failed: []
// }
```

### Error Handling

- If the Exchange Rate API is unavailable, the error is logged but doesn't crash the application
- Failed currency updates are logged separately
- The job continues processing remaining currencies even if one fails
- Cached rates remain available as fallback

### Testing

Tests are located in `src/tests/exchangeRateJob.test.js` and cover:
- Updating rates for multiple currencies
- Handling API failures
- Logging success and failure
- Starting and stopping the scheduled job
- Manual trigger functionality

Run tests with:
```bash
npm test -- exchangeRateJob.test.js
```

### Disabling the Job

To disable the scheduled job:
1. Set `NODE_ENV=test` (job doesn't run in test environment)
2. Or modify `src/server.js` to comment out the `startExchangeRateJob()` call

### Adding New Scheduled Jobs

To add a new scheduled job:

1. Create a new file in this directory (e.g., `myJob.js`)
2. Use the exchange rate job as a template
3. Export start, stop, and manual trigger functions
4. Add the job to `src/server.js` in the scheduled jobs section
5. Document the job in this README
6. Write comprehensive tests

Example structure:
```javascript
const cron = require('node-cron');

let scheduledJob = null;

const performTask = async () => {
  // Your job logic here
};

const startMyJob = (schedule = '0 3 * * *') => {
  scheduledJob = cron.schedule(schedule, async () => {
    await performTask();
  });
  return scheduledJob;
};

const stopMyJob = () => {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
  }
};

const runMyJobNow = async () => {
  return await performTask();
};

module.exports = {
  startMyJob,
  stopMyJob,
  runMyJobNow
};
```
