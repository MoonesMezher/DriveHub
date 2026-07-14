/**
 * صلاحيات دقيقة (RBAC) — تُربط بالأدوار في rolePermissions.js
 */
const PERMISSIONS = {
    // عام / زائر
    VIEW_PUBLIC: 'view:public',
    VIEW_LICENSES: 'view:licenses',
    VIEW_SCHOOLS: 'view:schools',
    VIEW_SAMPLE_PARTIAL: 'view:sample:partial',

    // مسجّل
    VIEW_SAMPLE_FULL: 'view:sample:full',
    MANAGE_PROFILE: 'profile:manage',
    UPLOAD_MEDIA: 'media:upload',
    SUBMIT_ENROLLMENT: 'enrollment:submit',
    CANCEL_PENDING_ENROLLMENT: 'enrollment:cancel',

    // طالب
    ACCESS_STUDENT_PORTAL: 'student:portal',
    LEARN_CONTENT: 'student:learn',
    TAKE_PRACTICE_EXAM: 'student:practice',
    BOOK_LESSONS: 'student:lessons',
    VIEW_EXAM_INFO: 'student:exam',
    VIEW_ARCHIVE: 'student:archive',
    VIEW_CERTIFICATES: 'student:certificates',

    // مدرب
    ACCESS_COACH_PORTAL: 'coach:portal',
    VIEW_COACH_SCHEDULE: 'coach:schedule',
    MANAGE_COACH_STUDENTS: 'coach:students',
    RATE_LESSONS: 'coach:rate',
    EDIT_TRAINING_CONTENT: 'coach:content:edit',

    // مدير مدرسة
    ACCESS_MANAGER_PORTAL: 'manager:portal',
    MANAGE_COURSES: 'manager:courses',
    REVIEW_ENROLLMENTS: 'manager:enrollments',
    VERIFY_ENROLLMENT_DOCUMENTS: 'manager:documents:verify',
    MANAGE_INSTRUCTORS: 'manager:instructors',
    SUBMIT_ROSTER: 'manager:roster',
    MANAGE_QUESTION_BANK: 'manager:questions',
    APPROVE_CONTENT_EDITS: 'manager:content:approve',

    // Admin
    ACCESS_ADMIN_PORTAL: 'admin:portal',
    MANAGE_PLATFORM_PRICING: 'admin:pricing',
    MANAGE_SCHOOLS: 'admin:schools',
    APPROVE_SCHOOL_APPLICATIONS: 'admin:schools:approve',
    MANAGE_USERS: 'admin:users',
    MANAGE_ROSTER_BATCH: 'admin:roster',
    DISTRIBUTE_TRAFFIC_DATA: 'admin:traffic',
    VIEW_PLATFORM_REPORTS: 'admin:reports',
    MANAGE_ADS: 'admin:ads',
    MANAGE_FAQ: 'admin:faq',
    MANAGE_REQUIREMENTS: 'admin:requirements',
    MANAGE_TESTIMONIALS: 'admin:testimonials',
    VIEW_COMPLIANCE: 'admin:compliance:view',
    MANAGE_COMPLIANCE: 'admin:compliance:manage',
    VIEW_AUDIT_LOG: 'admin:audit',
    VIEW_DOCUMENT_AUDIT: 'admin:documents:audit',

    // المرور
    ACCESS_TRAFFIC_PORTAL: 'traffic:portal',
    VIEW_TRAFFIC_DASHBOARD: 'traffic:dashboard',
    VIEW_TRAFFIC_ROSTERS: 'traffic:rosters',
    MANAGE_EXAM_SCHEDULES: 'traffic:schedules',
    ENTER_EXAM_RESULTS: 'traffic:results',
};

const PERMISSION_LIST = Object.values(PERMISSIONS);

module.exports = { PERMISSIONS, PERMISSION_LIST };
