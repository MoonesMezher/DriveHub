/**
 * One-shot demo seed for DriveHub.
 *
 * Runs admin (ADMIN_* env) + full demo dataset via runDevSeed:
 * licenses, schools, users/roles, courses, enrollments, wallets,
 * instructors (male + female coach), content/FAQ/requirements,
 * ads, compliance sample (pending school application).
 *
 * From backend/:
 *   npm run seed:all
 *
 * Individual scripts:
 *   npm run seed:admin | seed:dev | seed:content | seed:licenses
 *
 * Credentials: LOGIN.md (unchanged passwords).
 */
const { connectDatabase, disconnectDatabase } = require('../config/database');
const { runDevSeed, printSeedSummary } = require('./devSeed');

const seedAll = async () => {
    await connectDatabase();
    try {
        console.log('→ seed:all — loading DriveHub demo data…');
        const result = await runDevSeed();
        printSeedSummary(result);
        console.log('✓ seed:all complete — see LOGIN.md');
    } finally {
        await disconnectDatabase();
    }
};

if (require.main === module) {
    seedAll().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { seedAll };
