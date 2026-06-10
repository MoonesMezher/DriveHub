const COURSE_STATUS = {
    REGISTRATION_OPEN: 'registration_open',
    REGISTRATION_CLOSED: 'registration_closed',
    LAUNCH_PENDING: 'launch_pending',
    ACTIVE: 'active',
    COMPLETED: 'completed',
};

const COURSE_DURATION_DAYS = 15;
const DEFAULT_LAUNCH_AFTER_CLOSE_DAYS = 7;

module.exports = { COURSE_STATUS, COURSE_DURATION_DAYS, DEFAULT_LAUNCH_AFTER_CLOSE_DAYS };
