const { ROLES } = require('./roles');
const { PERMISSIONS: P } = require('./permissions');

const ROLE_PERMISSIONS = {
    [ROLES.GUEST]: [
        P.VIEW_PUBLIC,
        P.VIEW_LICENSES,
        P.VIEW_SCHOOLS,
        P.VIEW_SAMPLE_PARTIAL,
    ],
    [ROLES.REGISTERED]: [
        P.VIEW_PUBLIC,
        P.VIEW_LICENSES,
        P.VIEW_SCHOOLS,
        P.VIEW_SAMPLE_FULL,
        P.MANAGE_PROFILE,
        P.SUBMIT_ENROLLMENT,
        P.CANCEL_PENDING_ENROLLMENT,
    ],
    [ROLES.STUDENT]: [
        P.VIEW_PUBLIC,
        P.VIEW_LICENSES,
        P.VIEW_SCHOOLS,
        P.VIEW_SAMPLE_FULL,
        P.MANAGE_PROFILE,
        P.SUBMIT_ENROLLMENT,
        P.CANCEL_PENDING_ENROLLMENT,
        P.ACCESS_STUDENT_PORTAL,
        P.LEARN_CONTENT,
        P.TAKE_PRACTICE_EXAM,
        P.BOOK_LESSONS,
        P.VIEW_EXAM_INFO,
        P.VIEW_ARCHIVE,
        P.VIEW_CERTIFICATES,
    ],
    [ROLES.COACH]: [
        P.VIEW_PUBLIC,
        P.MANAGE_PROFILE,
        P.UPLOAD_MEDIA,
        P.ACCESS_COACH_PORTAL,
        P.VIEW_COACH_SCHEDULE,
        P.MANAGE_COACH_STUDENTS,
        P.RATE_LESSONS,
        P.EDIT_TRAINING_CONTENT,
    ],
    [ROLES.MANAGER]: [
        P.VIEW_PUBLIC,
        P.MANAGE_PROFILE,
        P.UPLOAD_MEDIA,
        P.ACCESS_MANAGER_PORTAL,
        P.MANAGE_COURSES,
        P.REVIEW_ENROLLMENTS,
        P.VERIFY_ENROLLMENT_DOCUMENTS,
        P.MANAGE_INSTRUCTORS,
        P.SUBMIT_ROSTER,
        P.MANAGE_QUESTION_BANK,
        P.APPROVE_CONTENT_EDITS,
    ],
    [ROLES.ADMIN]: Object.values(P),
    [ROLES.TRAFFIC]: [
        P.VIEW_PUBLIC,
        P.MANAGE_PROFILE,
        P.ACCESS_TRAFFIC_PORTAL,
        P.VIEW_TRAFFIC_DASHBOARD,
        P.VIEW_TRAFFIC_ROSTERS,
        P.MANAGE_EXAM_SCHEDULES,
        P.ENTER_EXAM_RESULTS,
    ],
};

/** بوابات تسجيل الدخول — الأدوار المسموحة لكل بوابة */
const LOGIN_PORTALS = {
    student: [ROLES.REGISTERED, ROLES.STUDENT],
    school: [ROLES.COACH, ROLES.MANAGER],
    admin: [ROLES.ADMIN, ROLES.TRAFFIC],
};

const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] || [];

const roleHasPermission = (role, permission) => {
    const perms = getPermissionsForRole(role);
    return perms.includes(permission);
};

const getEffectivePermissions = (roles) => {
    const set = new Set();
    roles.forEach((role) => {
        getPermissionsForRole(role).forEach((p) => set.add(p));
    });
    return [...set];
};

module.exports = {
    ROLE_PERMISSIONS,
    LOGIN_PORTALS,
    getPermissionsForRole,
    roleHasPermission,
    getEffectivePermissions,
};
