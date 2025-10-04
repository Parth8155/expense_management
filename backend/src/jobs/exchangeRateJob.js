const cron = require('node-cron');
const Company = require('../models/Company');
const { updateExchangeRates } = require('../services/currencyService');

/**
 * Exchange Rate Update Job
 * Scheduled job to fetch and cache exchange rates for all company currencies
 */

let scheduledJob = null;

/**
 * Update exchange rates for all companies
 * Fetches rates for each unique default currency used by companies
 */
const updateAllCompanyRates = async () => {
  const startTime = Date.now();
  console.log('[Exchange Rate Job] Starting scheduled exchange rate update...');

  try {
    // Get all unique default currencies from companies
    const companies = await Company.find({ defaultCurrency: { $exists: true } })
      .select('defaultCurrency')
      .lean();

    if (companies.length === 0) {
      console.log('[Exchange Rate Job] No companies found with default currencies');
      return;
    }

    // Get unique currencies
    const uniqueCurrencies = [...new Set(companies.map(c => c.defaultCurrency))];
    console.log(`[Exchange Rate Job] Found ${uniqueCurrencies.length} unique currencies to update: ${uniqueCurrencies.join(', ')}`);

    const results = {
      successful: [],
      failed: []
    };

    // Update rates for each currency
    for (const currency of uniqueCurrencies) {
      try {
        const result = await updateExchangeRates(currency);
        results.successful.push({
          currency,
          ratesCount: result.ratesCount,
          cachedCount: result.cachedCount
        });
        console.log(`[Exchange Rate Job] ✓ Updated ${result.cachedCount} rates for ${currency}`);
      } catch (error) {
        results.failed.push({
          currency,
          error: error.message
        });
        console.error(`[Exchange Rate Job] ✗ Failed to update rates for ${currency}: ${error.message}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Exchange Rate Job] Completed in ${duration}ms`);
    console.log(`[Exchange Rate Job] Summary: ${results.successful.length} successful, ${results.failed.length} failed`);

    if (results.failed.length > 0) {
      console.error('[Exchange Rate Job] Failed currencies:', results.failed.map(f => f.currency).join(', '));
    }

    return results;
  } catch (error) {
    console.error(`[Exchange Rate Job] Critical error during exchange rate update: ${error.message}`);
    throw error;
  }
};

/**
 * Start the scheduled exchange rate update job
 * Runs daily at 2:00 AM (server time)
 * @param {string} schedule - Cron schedule expression (default: '0 2 * * *' - daily at 2 AM)
 */
const startExchangeRateJob = (schedule = '0 2 * * *') => {
  if (scheduledJob) {
    console.log('[Exchange Rate Job] Job already running, stopping existing job first');
    stopExchangeRateJob();
  }

  console.log(`[Exchange Rate Job] Starting scheduled job with cron expression: ${schedule}`);
  
  scheduledJob = cron.schedule(schedule, async () => {
    await updateAllCompanyRates();
  }, {
    scheduled: true,
    timezone: process.env.TZ || 'UTC'
  });

  console.log('[Exchange Rate Job] Scheduled job started successfully');
  return scheduledJob;
};

/**
 * Stop the scheduled exchange rate update job
 */
const stopExchangeRateJob = () => {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
    console.log('[Exchange Rate Job] Scheduled job stopped');
  }
};

/**
 * Run exchange rate update immediately (manual trigger)
 * @returns {Promise<Object>} - Update results
 */
const runExchangeRateUpdateNow = async () => {
  console.log('[Exchange Rate Job] Manual trigger initiated');
  return await updateAllCompanyRates();
};

module.exports = {
  startExchangeRateJob,
  stopExchangeRateJob,
  runExchangeRateUpdateNow,
  updateAllCompanyRates
};
