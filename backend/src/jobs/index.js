/**
 * Background jobs (cron) — implement when enrollment/payment modules are ready.
 *
 * Planned jobs:
 * - expireAwaitingPaymentEnrollments (hourly)
 * - promoteWaitlistOnPaymentExpiry (hourly)
 * - sendExamReminders (daily)
 * - sendCourseLaunchReminders (daily)
 */

const { registerJobs } = require('./scheduler');

module.exports = { registerJobs };
