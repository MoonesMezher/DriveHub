const { ROLES } = require('./roles');

const PORTAL_HOME_ROUTES = {
    [ROLES.REGISTERED]: '/dashboard',
    [ROLES.STUDENT]: '/student',
    [ROLES.COACH]: '/coach',
    [ROLES.MANAGER]: '/manager',
    [ROLES.ADMIN]: '/admin',
    [ROLES.TRAFFIC]: '/traffic',
};

const getDefaultRouteForRole = (role) => PORTAL_HOME_ROUTES[role] || '/dashboard';

module.exports = { PORTAL_HOME_ROUTES, getDefaultRouteForRole };
