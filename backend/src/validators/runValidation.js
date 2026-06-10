const { validationResult } = require('express-validator');

/**
 * تشغيل قواعد التحقق على كائن وهمي (للاختبارات والخدمات)
 */
const runValidation = async (rules, payload, source = 'body') => {
    const req = {
        body: source === 'body' ? payload : {},
        query: source === 'query' ? payload : {},
        params: source === 'params' ? payload : {},
    };

    await Promise.all(rules.map((rule) => rule.run(req)));
    return validationResult(req);
};

module.exports = { runValidation };
