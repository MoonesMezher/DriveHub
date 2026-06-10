const { makeHandler } = require('../utils/controllerFactory');
const { trafficService } = require('../services');

module.exports = {
    listRosters: makeHandler((req) => trafficService.listRosters(req.query), { wrap: (d) => ({ rosters: d }) }),
    getRoster: makeHandler((req) => trafficService.getRoster(req.params.id), { wrap: (d) => ({ roster: d }) }),
    listSchedules: makeHandler((req) => trafficService.listSchedules(req.query), { wrap: (d) => ({ schedules: d }) }),
    createSchedule: makeHandler((req) => trafficService.createSchedule(req._user.userId, req.body), { status: 201 }),
    updateSchedule: makeHandler((req) => trafficService.updateSchedule(req.params.id, req.body)),
    enterResult: makeHandler((req) => trafficService.enterResult(req._user.userId, req.body), { status: 201 }),
    listResults: makeHandler((req) => trafficService.listResults(req.query), { wrap: (d) => ({ results: d }) }),
    issueLicense: makeHandler((req) => trafficService.issueLicenseRecord(req._user.userId, req.body), { status: 201 }),
};
