const { AuditLog } = require('../models');
const logger = require('../utils/logger');

class AuditService {
    async log(entry) {
        const record = {
            ...entry,
            at: entry.at || new Date(),
        };

        try {
            await AuditLog.create(record);
        } catch (err) {
            logger.error('audit.persist.failed', { message: err.message, action: entry.action });
        }

        logger.info('audit', record);
        return record;
    }

    async getRecent(limit = 50, filter = {}) {
        const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
        return AuditLog.find(filter)
            .populate('userId', 'name email')
            .sort({ at: -1 })
            .limit(parsedLimit)
            .lean();
    }
}

module.exports = new AuditService();
