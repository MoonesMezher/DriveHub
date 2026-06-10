const ROLES = {
    GUEST: 'guest',
    REGISTERED: 'registered',
    STUDENT: 'student',
    COACH: 'coach',
    MANAGER: 'manager',
    ADMIN: 'admin',
    TRAFFIC: 'traffic_authority',
};

const ROLE_LIST = Object.values(ROLES);

const DASHBOARD_ROLES = [
    ROLES.STUDENT,
    ROLES.COACH,
    ROLES.MANAGER,
    ROLES.ADMIN,
    ROLES.TRAFFIC,
];

module.exports = { ROLES, ROLE_LIST, DASHBOARD_ROLES };
