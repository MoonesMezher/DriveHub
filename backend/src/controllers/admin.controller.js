const { makeHandler } = require('../utils/controllerFactory');
const {
    platformService,
    licenseService,
    schoolApplicationService,
    reviewService,
    auditService,
} = require('../services');

module.exports = {
    listPricing: makeHandler(() => platformService.listPricing(), { wrap: (d) => ({ pricing: d }) }),
    upsertPricing: makeHandler((req) => platformService.upsertPricing(req.body, req._user.userId), { wrap: (d) => ({ pricing: d }) }),
    updateCommission: makeHandler((req) => platformService.updateCommission(req.body)),
    listLicenses: makeHandler(() => licenseService.list(), { wrap: (d) => ({ licenses: d }) }),
    upsertLicense: makeHandler((req) => licenseService.upsertCategory(req.body, req._user.userId), { wrap: (d) => ({ license: d }) }),
    upsertSubType: makeHandler((req) => licenseService.upsertSubType(req.body), { wrap: (d) => ({ subType: d }) }),
    listSchools: makeHandler((req) => platformService.listSchools(req.query), { wrap: (d) => ({ schools: d }) }),
    createSchool: makeHandler((req) => platformService.createSchool(req.body), { status: 201 }),
    updateSchool: makeHandler((req) => platformService.updateSchool(req.params.id, req.body)),
    listApplications: makeHandler((req) => schoolApplicationService.listPending(req.query), { wrap: (d) => ({ applications: d }) }),
    reviewApplication: makeHandler((req) => schoolApplicationService.review(req.params.id, req._user.userId, req.body)),
    listUsers: makeHandler((req) => platformService.listUsers(req.query), { wrap: (d) => ({ users: d }) }),
    assignRole: makeHandler((req) => platformService.assignRole(req.body, req._user.userId), { status: 201 }),
    suspendUser: makeHandler((req) => platformService.suspendUser(req.params.id, req.body)),
    listAds: makeHandler(() => platformService.listAds(), { wrap: (d) => ({ ads: d }) }),
    createAd: makeHandler((req) => platformService.createAd(req._user.userId, req.body), { status: 201 }),
    updateAd: makeHandler((req) => platformService.updateAd(req.params.id, req.body)),
    distributeRosters: makeHandler((req) => platformService.distributeRosters(req.body)),
    listAudit: makeHandler((req) => auditService.getRecent(req.query.limit, req.query), { wrap: (d) => ({ logs: d }) }),
    reports: makeHandler((req) => platformService.getReports(req.query), { wrap: (d) => ({ reports: d }) }),
    listPendingReviews: makeHandler(() => reviewService.listPending(), { wrap: (d) => ({ reviews: d }) }),
    moderateReview: makeHandler((req) => reviewService.moderate(req.params.id, req._user.userId, req.body), { wrap: (d) => ({ review: d }) }),
};
