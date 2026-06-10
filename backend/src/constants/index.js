const roles = require('./roles');
const enrollmentStatus = require('./enrollmentStatus');
const courseStatus = require('./courseStatus');

module.exports = {
    ...roles,
    ...enrollmentStatus,
    ...courseStatus,
};
