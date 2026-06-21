/**
 * Generates DriveHub Postman Collection v2.1 + Local Environment
 * Run: node backend/postman/generateCollection.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;

// ─── Helpers ───────────────────────────────────────────────────────────────

const successTests = (extra = '') => [
  "pm.test('Status is 2xx', () => pm.response.to.be.success);",
  "pm.test('success is true', () => pm.expect(pm.response.json().success).to.eql(true));",
  extra,
].filter(Boolean).join('\n');

const loginTests = (tokenVar) => successTests(`
const data = pm.response.json().data;
if (data?.accessToken) {
  pm.collectionVariables.set('${tokenVar}', data.accessToken);
  pm.collectionVariables.set('accessToken', data.accessToken);
}
if (data?.refreshToken) pm.collectionVariables.set('refreshToken', data.refreshToken);
if (data?.user?._id) pm.collectionVariables.set('userId', data.user._id);
`);

const errorTests = (code) => [
  `pm.test('Status is ${code}', () => pm.response.to.have.status(${code}));`,
  "pm.test('success is false', () => pm.expect(pm.response.json().success).to.eql(false));",
].join('\n');

const extractFirst = (dataPath, varName, idField = '_id') => `
const items = ${dataPath};
if (Array.isArray(items) && items[0]?.${idField}) {
  pm.collectionVariables.set('${varName}', items[0].${idField});
}
`;

function bearerAuth(tokenVar = 'accessToken') {
  return {
    type: 'bearer',
    bearer: [{ key: 'token', value: `{{${tokenVar}}}`, type: 'string' }],
  };
}

function jsonBody(obj) {
  return {
    mode: 'raw',
    raw: JSON.stringify(obj, null, 2),
    options: { raw: { language: 'json' } },
  };
}

function url(path, query = []) {
  const clean = path.startsWith('/') ? path.slice(1) : path;
  const parts = clean.split('/').filter(Boolean);
  return {
    raw: `{{baseUrl}}/${clean}`,
    host: ['{{baseUrl}}'],
    path: parts,
    query: query.map(([key, value, description]) => ({
      key, value: String(value), description, disabled: false,
    })),
  };
}

function request({
  name,
  method,
  path: reqPath,
  description = '',
  body = null,
  query = [],
  auth = null,
  tests = null,
  header = [],
}) {
  const item = {
    name,
    request: {
      method,
      header: [
        { key: 'Accept', value: 'application/json' },
        ...header,
      ],
      url: url(reqPath, query),
      description,
    },
    response: [],
  };
  if (body) item.request.body = body;
  if (auth !== undefined) item.request.auth = auth;
  if (tests) {
    item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: tests.split('\n') } }];
  }
  return item;
}

function folder(name, items, description = '', auth = undefined) {
  const f = { name, item: items, description };
  if (auth) f.auth = auth;
  return f;
}

// ─── Seed data constants ───────────────────────────────────────────────────

const SEED = {
  adminEmail: 'admin@drivehub.local',
  adminPassword: 'AdminPass1!',
  managerEmail: 'manager@drivehub.local',
  coachEmail: 'coach@drivehub.local',
  trafficEmail: 'traffic@drivehub.local',
  studentEmail: 'student@drivehub.local',
  activeStudentEmail: 'activestudent@drivehub.local',
  password: 'StudentPass1!',
  damascusLat: '33.5138',
  damascusLng: '36.2765',
  licenseCode: 'B',
  subTypeCode: 'B1',
};

// ─── Build folders ─────────────────────────────────────────────────────────

const setupFolder = folder('01 - Setup & Auth Tokens', [
  request({
    name: 'Health Check',
    method: 'GET',
    path: 'health',
    description: 'Verify API is running. No auth required.',
    auth: { type: 'noauth' },
    tests: successTests(),
  }),
  request({
    name: 'Login - Admin',
    method: 'POST',
    path: 'auth/login',
    description: 'Platform admin. Saves `adminToken` and `accessToken`. Run `npm run seed:admin` first.',
    auth: { type: 'noauth' },
    body: jsonBody({ email: SEED.adminEmail, password: SEED.adminPassword, portal: 'admin' }),
    tests: loginTests('adminToken'),
  }),
  request({
    name: 'Login - Manager',
    method: 'POST',
    path: 'auth/login',
    description: 'School manager (مدرسة النور). Saves `managerToken`.',
    auth: { type: 'noauth' },
    body: jsonBody({ email: SEED.managerEmail, password: SEED.password, portal: 'school' }),
    tests: loginTests('managerToken'),
  }),
  request({
    name: 'Login - Active Student',
    method: 'POST',
    path: 'auth/login',
    description: 'Student with active enrollment. Saves `studentToken`.',
    auth: { type: 'noauth' },
    body: jsonBody({ email: SEED.activeStudentEmail, password: SEED.password, portal: 'student' }),
    tests: loginTests('studentToken'),
  }),
  request({
    name: 'Login - Registered Student',
    method: 'POST',
    path: 'auth/login',
    description: 'Registered user without active course. Saves `registeredToken`.',
    auth: { type: 'noauth' },
    body: jsonBody({ email: SEED.studentEmail, password: SEED.password, portal: 'student' }),
    tests: loginTests('registeredToken'),
  }),
  request({
    name: 'Login - Coach',
    method: 'POST',
    path: 'auth/login',
    description: 'Coach at مدرسة النور. Saves `coachToken`.',
    auth: { type: 'noauth' },
    body: jsonBody({ email: SEED.coachEmail, password: SEED.password, portal: 'school' }),
    tests: loginTests('coachToken'),
  }),
  request({
    name: 'Login - Traffic',
    method: 'POST',
    path: 'auth/login',
    description: 'Traffic authority officer. Saves `trafficToken`.',
    auth: { type: 'noauth' },
    body: jsonBody({ email: SEED.trafficEmail, password: SEED.password, portal: 'admin' }),
    tests: loginTests('trafficToken'),
  }),
  request({
    name: 'Resolve - List Nearby Schools',
    method: 'GET',
    path: 'schools/nearby',
    description: 'Saves first `schoolId` from nearby schools (Damascus coords).',
    auth: { type: 'noauth' },
    query: [['lat', SEED.damascusLat], ['lng', SEED.damascusLng], ['limit', '5']],
    tests: successTests(extractFirst('pm.response.json().data?.items || pm.response.json().data', 'schoolId')),
  }),
  request({
    name: 'Resolve - School Courses',
    method: 'GET',
    path: 'schools/{{schoolId}}/courses',
    description: 'Saves first `courseId` for enrollment tests.',
    auth: { type: 'noauth' },
    tests: successTests(extractFirst('pm.response.json().data?.courses || pm.response.json().data', 'courseId')),
  }),
  request({
    name: 'Resolve - Admin List Schools',
    method: 'GET',
    path: 'admin/schools',
    description: 'Admin view of schools. Saves `adminSchoolId`.',
    query: [['limit', '5']],
    tests: successTests(extractFirst('pm.response.json().data?.schools || pm.response.json().data', 'adminSchoolId')),
  }),
  request({
    name: 'Refresh Token',
    method: 'POST',
    path: 'auth/refresh',
    description: 'Refresh access token using `refreshToken` variable.',
    auth: { type: 'noauth' },
    body: jsonBody({ refreshToken: '{{refreshToken}}' }),
    tests: loginTests('accessToken'),
  }),
], 'Run this folder first (or use Collection Runner). Populates all auth tokens and dynamic IDs.');

const publicFolder = folder('02 - Public', [
  folder('Health & Root', [
    request({ name: 'API Root', method: 'GET', path: '', description: 'GET http://localhost:3000/ — set URL manually to {{rootUrl}} or http://localhost:3000', auth: { type: 'noauth' } }),
    request({ name: 'Health', method: 'GET', path: 'health', auth: { type: 'noauth' }, tests: successTests() }),
  ]),
  folder('Licenses', [
    request({ name: 'List License Categories', method: 'GET', path: 'licenses', auth: { type: 'noauth' }, tests: successTests() }),
    request({ name: 'Get License by Code', method: 'GET', path: `licenses/${SEED.licenseCode}`, auth: { type: 'noauth' }, tests: successTests() }),
    request({ name: 'Get License - Not Found', method: 'GET', path: 'licenses/ZZZ', auth: { type: 'noauth' }, tests: errorTests(404) }),
  ]),
  folder('Schools', [
    request({ name: 'Schools Map', method: 'GET', path: 'schools/map', auth: { type: 'noauth' }, query: [['lat', SEED.damascusLat], ['lng', SEED.damascusLng]], tests: successTests() }),
    request({ name: 'Schools Nearby', method: 'GET', path: 'schools/nearby', auth: { type: 'noauth' }, query: [['lat', SEED.damascusLat], ['lng', SEED.damascusLng], ['limit', '10']], tests: successTests() }),
    request({ name: 'School Detail', method: 'GET', path: 'schools/{{schoolId}}', auth: { type: 'noauth' }, tests: successTests() }),
    request({ name: 'School Courses', method: 'GET', path: 'schools/{{schoolId}}/courses', auth: { type: 'noauth' }, tests: successTests() }),
    request({ name: 'School Coaches', method: 'GET', path: 'schools/{{schoolId}}/coaches', auth: { type: 'noauth' }, tests: successTests() }),
  ]),
  folder('Content & Settings', [
    request({ name: 'Sample Content', method: 'GET', path: 'content/sample', auth: { type: 'noauth' }, tests: successTests() }),
    request({ name: 'Privacy Policy', method: 'GET', path: 'settings/privacy', auth: { type: 'noauth' }, tests: successTests() }),
  ]),
  folder('Reviews', [
    request({ name: 'List School Reviews', method: 'GET', path: 'reviews/school/{{schoolId}}', auth: { type: 'noauth' }, tests: successTests() }),
    request({ name: 'Submit Review', method: 'POST', path: 'reviews', body: jsonBody({ schoolId: '{{schoolId}}', rating: 5, comment: 'مدرسة ممتازة — اختبار Postman' }), tests: successTests("if (pm.response.json().data?.review?._id) pm.collectionVariables.set('reviewId', pm.response.json().data.review._id);") }),
  ], '', bearerAuth('registeredToken')),
  folder('Rosters', [
    request({ name: 'Verify Roster Token', method: 'GET', path: 'rosters/verify/{{rosterToken}}', auth: { type: 'noauth' }, description: 'Set `rosterToken` after manager submits roster.' }),
  ]),
]);

const authFolder = folder('03 - Auth', [
  request({
    name: 'Register New User',
    method: 'POST',
    path: 'auth/register',
    auth: { type: 'noauth' },
    body: jsonBody({
      name: 'مستخدم تجريبي',
      email: `testuser+${Date.now()}@drivehub.local`,
      phone: '+963900000001',
      password: 'TestPass1!',
    }),
    tests: successTests(),
    description: 'Creates a new registered user. Email uses timestamp to avoid duplicates.',
  }),
  request({ name: 'Get Me', method: 'GET', path: 'auth/me', tests: successTests() }),
  request({ name: 'Get Contexts', method: 'GET', path: 'auth/contexts', tests: successTests() }),
  request({
    name: 'Switch Context - Student',
    method: 'POST',
    path: 'auth/switch-context',
    body: jsonBody({ role: 'student' }),
    tests: successTests(),
    description: 'Switch active role context. Use after login if user has multiple roles.',
  }),
  request({
    name: 'Logout',
    method: 'POST',
    path: 'auth/logout',
    body: jsonBody({ refreshToken: '{{refreshToken}}' }),
    tests: successTests(),
  }),
  folder('Error States', [
    request({ name: 'Login - Wrong Password', method: 'POST', path: 'auth/login', auth: { type: 'noauth' }, body: jsonBody({ email: SEED.studentEmail, password: 'WrongPass1!' }), tests: errorTests(401) }),
    request({ name: 'Get Me - No Token', method: 'GET', path: 'auth/me', auth: { type: 'noauth' }, tests: errorTests(401) }),
  ]),
], '', bearerAuth('accessToken'));

const userFolder = folder('04 - User (Authenticated)', [
  folder('Profile', [
    request({ name: 'Get Profile', method: 'GET', path: 'profile', tests: successTests() }),
    request({ name: 'Update Profile', method: 'PATCH', path: 'profile', body: jsonBody({ name: 'اسم محدّث', phone: '+963911111111' }), tests: successTests() }),
  ]),
  folder('Location', [
    request({ name: 'Save Location', method: 'POST', path: 'location', body: jsonBody({ lat: parseFloat(SEED.damascusLat), lng: parseFloat(SEED.damascusLng), source: 'manual', governorate: 'دمشق' }), tests: successTests() }),
    request({ name: 'Get Location', method: 'GET', path: 'location', tests: successTests() }),
  ]),
  folder('Enrollments', [
    request({ name: 'List My Enrollments', method: 'GET', path: 'enrollments', tests: successTests(extractFirst('pm.response.json().data?.enrollments || pm.response.json().data', 'enrollmentId')) }),
    request({
      name: 'Create Enrollment',
      method: 'POST',
      path: 'enrollments',
      body: jsonBody({
        courseId: '{{courseId}}',
        schoolId: '{{schoolId}}',
        categoryCode: SEED.licenseCode,
        subTypeCode: SEED.subTypeCode,
        prefersFemaleCoach: false,
      }),
      tests: successTests("const e = pm.response.json().data?.enrollment; if (e?._id) pm.collectionVariables.set('enrollmentId', e._id);"),
      description: 'Requires open course. Use registered student token. May fail if pending enrollment exists.',
    }),
    request({ name: 'Get Enrollment by ID', method: 'GET', path: 'enrollments/{{enrollmentId}}', tests: successTests() }),
    request({ name: 'Initiate Payment', method: 'POST', path: 'enrollments/{{enrollmentId}}/payment/initiate', tests: successTests() }),
    request({ name: 'Confirm Payment', method: 'POST', path: 'enrollments/{{enrollmentId}}/payment/confirm', body: jsonBody({ amount: 500000, gatewayRef: 'POSTMAN-MOCK-001' }), tests: successTests() }),
    request({ name: 'Cancel Pending Enrollment', method: 'DELETE', path: 'enrollments/{{enrollmentId}}', tests: successTests(), description: 'Only works for pending enrollments.' }),
    request({ name: 'Create Retake Enrollment', method: 'POST', path: 'enrollments/retake', body: jsonBody({ priorEnrollmentId: '{{enrollmentId}}', retakeScope: 'full' }), tests: successTests() }),
  ], '', bearerAuth('registeredToken')),
  folder('Pre-Registrations', [
    request({ name: 'List Pre-Registrations', method: 'GET', path: 'pre-registrations', tests: successTests() }),
    request({ name: 'Create Pre-Registration', method: 'POST', path: 'pre-registrations', body: jsonBody({ schoolId: '{{schoolId}}', categoryCode: SEED.licenseCode, subTypeCode: SEED.subTypeCode }), tests: successTests() }),
    request({ name: 'Cancel Pre-Registration', method: 'DELETE', path: 'pre-registrations/{{preRegistrationId}}', tests: successTests() }),
  ], '', bearerAuth('registeredToken')),
  folder('School Applications', [
    request({
      name: 'Submit School Application',
      method: 'POST',
      path: 'school-applications',
      body: jsonBody({
        schoolName: 'مدرسة اختبار Postman',
        address: 'دمشق — المزة',
        governorate: 'دمشق',
        lat: 33.51,
        lng: 36.27,
        phone: '0110000000',
        email: 'newschool@drivehub.local',
        licenses: ['B'],
      }),
      tests: successTests("const a = pm.response.json().data?.application; if (a?._id) pm.collectionVariables.set('schoolApplicationId', a._id);"),
    }),
    request({ name: 'My Applications', method: 'GET', path: 'school-applications/mine', tests: successTests() }),
    request({ name: 'Get Application', method: 'GET', path: 'school-applications/{{schoolApplicationId}}', tests: successTests() }),
  ], '', bearerAuth('registeredToken')),
  folder('Documents', [
    request({
      name: 'Upload Document',
      method: 'POST',
      path: 'documents',
      description: 'Multipart upload. Attach a PDF/image file in Body > form-data.',
      header: [],
      body: {
        mode: 'formdata',
        formdata: [
          { key: 'type', value: 'national_id', type: 'text' },
          { key: 'file', type: 'file', src: [], description: 'Select a test file' },
        ],
      },
      tests: successTests("const d = pm.response.json().data?.document; if (d?._id) pm.collectionVariables.set('documentId', d._id);"),
    }),
    request({ name: 'Get Document', method: 'GET', path: 'documents/{{documentId}}', tests: successTests() }),
  ], '', bearerAuth('registeredToken')),
  folder('Notifications', [
    request({ name: 'List Notifications', method: 'GET', path: 'notifications', query: [['limit', '20']], tests: successTests(extractFirst('pm.response.json().data?.notifications || pm.response.json().data', 'notificationId')) }),
    request({ name: 'Mark All Read', method: 'POST', path: 'notifications/read-all', tests: successTests() }),
    request({ name: 'Mark One Read', method: 'PATCH', path: 'notifications/{{notificationId}}/read', tests: successTests() }),
  ]),
  folder('Search', [
    request({ name: 'Global Search', method: 'GET', path: 'search', query: [['q', 'مدرسة']], tests: successTests() }),
  ]),
], '', bearerAuth('accessToken'));

const studentFolder = folder('05 - Student Portal', [
  request({ name: 'Dashboard', method: 'GET', path: 'student/dashboard', tests: successTests() }),
  request({ name: 'Statistics', method: 'GET', path: 'student/statistics', tests: successTests() }),
  request({ name: 'Archive', method: 'GET', path: 'student/archive', tests: successTests() }),
  folder('Content', [
    request({ name: 'List Theory', method: 'GET', path: 'student/content/theory', query: [['limit', '20']], tests: successTests(extractFirst('pm.response.json().data?.items || pm.response.json().data', 'theoryContentId')) }),
    request({ name: 'Get Theory Item', method: 'GET', path: 'student/content/theory/{{theoryContentId}}', tests: successTests() }),
    request({ name: 'Shared Content', method: 'GET', path: 'student/content/shared', tests: successTests() }),
    request({ name: 'Specific Content', method: 'GET', path: 'student/content/specific', tests: successTests() }),
    request({ name: 'Videos', method: 'GET', path: 'student/content/videos', tests: successTests() }),
    request({ name: 'Get Unlock Mode', method: 'GET', path: 'student/content/unlock', tests: successTests() }),
    request({ name: 'Set Unlock Mode', method: 'POST', path: 'student/content/unlock', body: jsonBody({ categoryCode: SEED.licenseCode, mode: 'progressive' }), tests: successTests() }),
  ]),
  folder('Practice Exam', [
    request({
      name: 'Start Practice',
      method: 'POST',
      path: 'student/practice/start',
      body: jsonBody({ categoryCode: SEED.licenseCode, subTypeCode: SEED.subTypeCode, questionCount: 10, durationSeconds: 600 }),
      tests: successTests("const s = pm.response.json().data?.session; if (s?._id) pm.collectionVariables.set('practiceSessionId', s._id); if (s?.questions?.[0]?._id) pm.collectionVariables.set('questionId', s.questions[0]._id);"),
    }),
    request({
      name: 'Submit Practice',
      method: 'POST',
      path: 'student/practice/submit',
      body: jsonBody({ sessionId: '{{practiceSessionId}}', durationSeconds: 120, answers: [{ questionId: '{{questionId}}', selectedKey: 'A' }] }),
      tests: successTests(),
    }),
    request({ name: 'List Practice History', method: 'GET', path: 'student/practice', tests: successTests() }),
  ]),
  folder('Lessons', [
    request({ name: 'Eligible Coaches', method: 'GET', path: 'student/lessons/eligible-coaches', tests: successTests(extractFirst('pm.response.json().data?.coaches || pm.response.json().data', 'coachId')) }),
    request({
      name: 'Book Lesson',
      method: 'POST',
      path: 'student/lessons',
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          enrollmentId: '{{enrollmentId}}',
          coachId: '{{coachId}}',
          scheduledAt: '{{$isoTimestamp}}',
          durationMinutes: 60,
        }, null, 2),
        options: { raw: { language: 'json' } },
      },
      tests: successTests("const l = pm.response.json().data?.lesson; if (l?._id) pm.collectionVariables.set('lessonId', l._id);"),
    }),
    request({ name: 'Auto Book Lesson', method: 'POST', path: 'student/lessons/auto-book', body: jsonBody({ enrollmentId: '{{enrollmentId}}', durationMinutes: 60 }), tests: successTests() }),
    request({ name: 'List Lessons', method: 'GET', path: 'student/lessons', tests: successTests() }),
  ]),
  folder('Exam & Certificates', [
    request({ name: 'Exam Info', method: 'GET', path: 'student/exam-info', tests: successTests() }),
    request({ name: 'Certificates', method: 'GET', path: 'student/certificates', tests: successTests() }),
  ]),
], 'Requires active student enrollment. Use `studentToken` from Setup.', bearerAuth('studentToken'));

const coachFolder = folder('06 - Coach Portal', [
  request({ name: 'Schedule', method: 'GET', path: 'coach/schedule', query: [['limit', '20']], tests: successTests(extractFirst('pm.response.json().data?.schedule || pm.response.json().data', 'lessonId')) }),
  request({ name: 'Students', method: 'GET', path: 'coach/students', tests: successTests(extractFirst('pm.response.json().data?.students || pm.response.json().data', 'studentUserId', 'userId')) }),
  request({
    name: 'Complete Lesson',
    method: 'PATCH',
    path: 'coach/lessons/{{lessonId}}/complete',
    body: jsonBody({ status: 'completed', rating: 4, coachNotes: 'أداء جيد — اختبار Postman' }),
    tests: successTests(),
  }),
  request({
    name: 'Add Note',
    method: 'POST',
    path: 'coach/notes',
    body: jsonBody({ studentId: '{{studentUserId}}', schoolId: '{{schoolId}}', personalNotes: 'ملاحظة تجريبية', lessonRating: 5 }),
    tests: successTests(),
  }),
  request({ name: 'List Notes', method: 'GET', path: 'coach/notes', tests: successTests() }),
  request({
    name: 'Request Question Edit',
    method: 'POST',
    path: 'coach/edits/questions',
    body: jsonBody({ questionBankId: '{{questionBankId}}', questionId: '{{questionId}}', proposedChanges: { text: 'نص السؤال المقترح' } }),
    tests: successTests(),
  }),
  request({
    name: 'Request Content Edit',
    method: 'POST',
    path: 'coach/edits/content',
    body: jsonBody({ contentType: 'theory', contentId: '{{theoryContentId}}', proposedChanges: 'تحديث المحتوى المقترح' }),
    tests: successTests(),
  }),
], 'Coach at مدرسة النور. Use `coachToken`.', bearerAuth('coachToken'));

const managerFolder = folder('07 - Manager Portal', [
  folder('Courses', [
    request({ name: 'List Courses', method: 'GET', path: 'manager/courses', query: [['limit', '20']], tests: successTests(extractFirst('pm.response.json().data?.courses || pm.response.json().data', 'managerCourseId')) }),
    request({
      name: 'Create Course',
      method: 'POST',
      path: 'manager/courses',
      body: jsonBody({ schoolId: '{{schoolId}}', categoryCode: SEED.licenseCode, subTypeCode: SEED.subTypeCode, maxStudents: 30, paymentDeadlineDays: 7, launchAfterCloseDays: 3 }),
      tests: successTests("const c = pm.response.json().data?.course; if (c?._id) pm.collectionVariables.set('managerCourseId', c._id);"),
    }),
    request({ name: 'Close Course Registration', method: 'PATCH', path: 'manager/courses/{{managerCourseId}}/close', tests: successTests() }),
    request({ name: 'Launch Course', method: 'POST', path: 'manager/courses/{{managerCourseId}}/launch', body: jsonBody({}), tests: successTests() }),
  ]),
  folder('Enrollments', [
    request({ name: 'Enrollment Queue', method: 'GET', path: 'manager/courses/{{managerCourseId}}/enrollments', tests: successTests() }),
    request({ name: 'Roster Candidates', method: 'GET', path: 'manager/courses/{{managerCourseId}}/roster-candidates', tests: successTests() }),
    request({ name: 'Accept Enrollment', method: 'POST', path: 'manager/enrollments/{{enrollmentId}}/accept', body: jsonBody({ paymentDeadlineDays: 7 }), tests: successTests() }),
    request({ name: 'Reject Enrollment', method: 'POST', path: 'manager/enrollments/{{enrollmentId}}/reject', body: jsonBody({ rejectionReason: 'لا توجد أماكن متاحة' }), tests: successTests() }),
  ]),
  folder('Instructors', [
    request({ name: 'List Instructors', method: 'GET', path: 'manager/instructors', tests: successTests(extractFirst('pm.response.json().data?.instructors || pm.response.json().data', 'instructorId')) }),
    request({
      name: 'Assign Instructor',
      method: 'POST',
      path: 'manager/instructors',
      body: jsonBody({ email: 'newcoach@drivehub.local', schoolId: '{{schoolId}}', licenseCategories: ['B'], gender: 'male', isFemaleCoach: false }),
      tests: successTests(),
    }),
    request({ name: 'Update Instructor', method: 'PATCH', path: 'manager/instructors/{{instructorId}}', body: jsonBody({ status: 'active', licenseCategories: ['B', 'A'] }), tests: successTests() }),
  ]),
  folder('Question Banks', [
    request({ name: 'List Question Banks', method: 'GET', path: 'manager/question-banks', tests: successTests(extractFirst('pm.response.json().data?.banks || pm.response.json().data', 'questionBankId')) }),
    request({
      name: 'Create Question Bank',
      method: 'POST',
      path: 'manager/question-banks',
      body: jsonBody({
        schoolId: '{{schoolId}}',
        title: 'بنك اختبار Postman',
        categoryCode: SEED.licenseCode,
        subTypeCode: SEED.subTypeCode,
        questions: [{
          text: 'ما الحد الأقصى للسرعة داخل المدينة؟',
          type: 'mcq',
          options: [{ key: 'A', text: '40 كم/س' }, { key: 'B', text: '60 كم/س' }],
          correctKey: 'A',
        }],
      }),
      tests: successTests(),
    }),
    request({
      name: 'Add Question',
      method: 'POST',
      path: 'manager/question-banks/{{questionBankId}}/questions',
      body: jsonBody({ text: 'سؤال إضافي', type: 'mcq', options: [{ key: 'A', text: 'نعم' }, { key: 'B', text: 'لا' }], correctKey: 'A' }),
      tests: successTests(),
    }),
  ]),
  folder('Content Edits', [
    request({ name: 'Pending Edits', method: 'GET', path: 'manager/content-edits/pending', tests: successTests(extractFirst('pm.response.json().data?.edits || pm.response.json().data', 'contentEditId')) }),
    request({ name: 'Review Edit - Approve', method: 'POST', path: 'manager/content-edits/{{contentEditId}}/review', body: jsonBody({ status: 'approved', reviewNote: 'موافق' }), tests: successTests() }),
    request({ name: 'Review Edit - Reject', method: 'POST', path: 'manager/content-edits/{{contentEditId}}/review', body: jsonBody({ status: 'rejected', reviewNote: 'مرفوض' }), tests: successTests() }),
  ]),
  folder('Rosters', [
    request({ name: 'List Rosters', method: 'GET', path: 'manager/rosters', tests: successTests(extractFirst('pm.response.json().data?.rosters || pm.response.json().data', 'rosterId')) }),
    request({
      name: 'Create Roster',
      method: 'POST',
      path: 'manager/rosters',
      body: jsonBody({ courseId: '{{managerCourseId}}', schoolId: '{{schoolId}}', studentIds: ['{{studentUserId}}'], enrollmentIds: ['{{enrollmentId}}'] }),
      tests: successTests("const r = pm.response.json().data?.roster; if (r?._id) pm.collectionVariables.set('rosterId', r._id); if (r?.verifyToken) pm.collectionVariables.set('rosterToken', r.verifyToken);"),
    }),
    request({ name: 'Submit Roster', method: 'POST', path: 'manager/rosters/{{rosterId}}/submit', body: jsonBody({ status: 'submitted' }), tests: successTests() }),
  ]),
  folder('Schedule & Results', [
    request({ name: 'School Schedule', method: 'GET', path: 'manager/schedule', tests: successTests() }),
    request({
      name: 'Record Final Result',
      method: 'POST',
      path: 'manager/exam-results',
      body: jsonBody({ enrollmentId: '{{enrollmentId}}', theoryScore: 85, practicalScore: 90, finalStatus: 'passed', attemptNumber: 1 }),
      tests: successTests(),
    }),
  ]),
], 'School manager portal. Scoped to manager school. Use `managerToken`.', bearerAuth('managerToken'));

const adminFolder = folder('08 - Admin Portal', [
  folder('Pricing & Licenses', [
    request({ name: 'List Pricing', method: 'GET', path: 'admin/pricing', tests: successTests() }),
    request({ name: 'Upsert Pricing', method: 'PUT', path: 'admin/pricing', body: jsonBody({ categoryCode: 'B', subTypeCode: 'B1', fixedPrice: 500000, currency: 'SYP', isActive: true }), tests: successTests() }),
    request({ name: 'Update Commission', method: 'PATCH', path: 'admin/commission', body: jsonBody({ commission: 0.02 }), tests: successTests() }),
    request({ name: 'List Licenses (Admin)', method: 'GET', path: 'admin/licenses', tests: successTests() }),
    request({ name: 'Upsert License Category', method: 'PUT', path: 'admin/licenses/categories', body: jsonBody({ code: 'B', name: 'خصوصي', minAge: 18, briefDesc: 'سيارات خاصة', order: 1 }), tests: successTests() }),
    request({ name: 'Upsert Sub-Type', method: 'PUT', path: 'admin/licenses/sub-types', body: jsonBody({ parentCode: 'B', subCode: 'B1', name: 'عادي (يدوي)', transmissionType: 'manual' }), tests: successTests() }),
  ]),
  folder('Schools', [
    request({ name: 'List Schools', method: 'GET', path: 'admin/schools', query: [['limit', '20']], tests: successTests() }),
    request({
      name: 'Create School',
      method: 'POST',
      path: 'admin/schools',
      body: jsonBody({
        name: 'مدرسة Postman الجديدة',
        description: 'مدرسة تجريبية',
        phone: '0112223333',
        email: 'postman-school@drivehub.local',
        address: 'دمشق',
        governorate: 'دمشق',
        lat: 33.51,
        lng: 36.27,
        licenses: ['B'],
        vehiclesCount: 5,
        hasFemaleCoaches: true,
      }),
      tests: successTests(),
    }),
    request({ name: 'Update School', method: 'PATCH', path: 'admin/schools/{{adminSchoolId}}', body: jsonBody({ description: 'وصف محدّث' }), tests: successTests() }),
    request({ name: 'Delete School', method: 'DELETE', path: 'admin/schools/{{adminSchoolId}}', description: 'Only works if school has no active enrollments.', tests: successTests() }),
  ]),
  folder('School Applications', [
    request({ name: 'List Applications', method: 'GET', path: 'admin/school-applications', tests: successTests(extractFirst('pm.response.json().data?.applications || pm.response.json().data', 'schoolApplicationId')) }),
    request({ name: 'Approve Application', method: 'POST', path: 'admin/school-applications/{{schoolApplicationId}}/review', body: jsonBody({ status: 'approved' }), tests: successTests() }),
    request({ name: 'Reject Application', method: 'POST', path: 'admin/school-applications/{{schoolApplicationId}}/review', body: jsonBody({ status: 'rejected', rejectionReason: 'بيانات ناقصة' }), tests: successTests() }),
  ]),
  folder('Users', [
    request({ name: 'List Users', method: 'GET', path: 'admin/users', query: [['limit', '20']], tests: successTests(extractFirst('pm.response.json().data?.users || pm.response.json().data', 'targetUserId')) }),
    request({ name: 'Assign Role', method: 'POST', path: 'admin/users/roles', body: jsonBody({ userId: '{{targetUserId}}', role: 'coach', schoolId: '{{schoolId}}', licenseCategories: ['B'] }), tests: successTests() }),
    request({
      name: 'Create Traffic Account',
      method: 'POST',
      path: 'admin/users/traffic-accounts',
      body: jsonBody({ name: 'ضابط مرور', email: `traffic+${Date.now()}@drivehub.local`, phone: '+963900000099', password: 'TrafficPass1!' }),
      tests: successTests(),
    }),
    request({ name: 'Suspend User', method: 'PATCH', path: 'admin/users/{{targetUserId}}/status', body: jsonBody({ status: 'suspended', reason: 'اختبار' }), tests: successTests() }),
    request({ name: 'Activate User', method: 'PATCH', path: 'admin/users/{{targetUserId}}/status', body: jsonBody({ status: 'active' }), tests: successTests() }),
  ]),
  folder('Settings', [
    request({ name: 'Get Privacy Settings', method: 'GET', path: 'admin/settings/privacy', tests: successTests() }),
    request({ name: 'Update Privacy', method: 'PUT', path: 'admin/settings/privacy', body: jsonBody({ content: '# سياسة الخصوصية\n\nنص تجريبي محدّث من Postman.' }), tests: successTests() }),
    request({ name: 'Get Registration Settings', method: 'GET', path: 'admin/settings/registration', tests: successTests() }),
    request({ name: 'Pause Registration', method: 'PUT', path: 'admin/settings/registration', body: jsonBody({ registrationPaused: true }), tests: successTests() }),
    request({ name: 'Resume Registration', method: 'PUT', path: 'admin/settings/registration', body: jsonBody({ registrationPaused: false }), tests: successTests() }),
  ]),
  folder('Reviews & Ads', [
    request({ name: 'Pending Reviews', method: 'GET', path: 'admin/reviews/pending', tests: successTests(extractFirst('pm.response.json().data?.reviews || pm.response.json().data', 'reviewId')) }),
    request({ name: 'Approve Review', method: 'PATCH', path: 'admin/reviews/{{reviewId}}/moderate', body: jsonBody({ adminStatus: 'approved' }), tests: successTests() }),
    request({ name: 'Reject Review', method: 'PATCH', path: 'admin/reviews/{{reviewId}}/moderate', body: jsonBody({ adminStatus: 'rejected' }), tests: successTests() }),
    request({ name: 'List Ads', method: 'GET', path: 'admin/ads', tests: successTests(extractFirst('pm.response.json().data?.ads || pm.response.json().data', 'adId')) }),
    request({
      name: 'Create Ad',
      method: 'POST',
      path: 'admin/ads',
      body: jsonBody({ title: 'إعلان تجريبي', placement: 'home_banner', content: 'نص الإعلان', isActive: true, priority: 1 }),
      tests: successTests(),
    }),
    request({ name: 'Update Ad', method: 'PATCH', path: 'admin/ads/{{adId}}', body: jsonBody({ isActive: false }), tests: successTests() }),
  ]),
  folder('Traffic & Audit', [
    request({ name: 'Distribute Rosters', method: 'POST', path: 'admin/traffic/distribute', body: jsonBody({}), tests: successTests() }),
    request({ name: 'Audit Log', method: 'GET', path: 'admin/audit', query: [['limit', '50']], tests: successTests() }),
    request({ name: 'Platform Reports', method: 'GET', path: 'admin/reports', tests: successTests() }),
  ]),
], 'Platform admin. Use `adminToken`. Ultra permissions.', bearerAuth('adminToken'));

const trafficFolder = folder('09 - Traffic Portal', [
  request({ name: 'Dashboard', method: 'GET', path: 'traffic/dashboard', tests: successTests() }),
  folder('Rosters', [
    request({ name: 'List Rosters', method: 'GET', path: 'traffic/rosters', query: [['limit', '20']], tests: successTests(extractFirst('pm.response.json().data?.rosters || pm.response.json().data', 'trafficRosterId')) }),
    request({ name: 'Roster Detail', method: 'GET', path: 'traffic/rosters/{{trafficRosterId}}', tests: successTests() }),
  ]),
  folder('Schedules', [
    request({ name: 'List Schedules', method: 'GET', path: 'traffic/schedules', tests: successTests(extractFirst('pm.response.json().data?.schedules || pm.response.json().data', 'scheduleId')) }),
    request({
      name: 'Create Schedule',
      method: 'POST',
      path: 'traffic/schedules',
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          governorate: 'دمشق',
          studentId: '{{studentUserId}}',
          enrollmentId: '{{enrollmentId}}',
          examType: 'theory',
          examDate: '{{$isoTimestamp}}',
          branch: 'فرع دمشق',
        }, null, 2),
        options: { raw: { language: 'json' } },
      },
      tests: successTests("const s = pm.response.json().data?.schedule; if (s?._id) pm.collectionVariables.set('scheduleId', s._id);"),
    }),
    request({ name: 'Update Schedule', method: 'PATCH', path: 'traffic/schedules/{{scheduleId}}', body: jsonBody({ branch: 'فرع محدّث' }), tests: successTests() }),
  ]),
  folder('Results', [
    request({ name: 'List Enrollments', method: 'GET', path: 'traffic/enrollments', tests: successTests() }),
    request({ name: 'List Results', method: 'GET', path: 'traffic/results', tests: successTests() }),
    request({
      name: 'Enter Single Result',
      method: 'POST',
      path: 'traffic/results',
      body: jsonBody({
        studentId: '{{studentUserId}}',
        enrollmentId: '{{enrollmentId}}',
        examType: 'theory',
        passed: true,
        score: 88,
        scheduleId: '{{scheduleId}}',
        notes: 'اختبار Postman',
      }),
      tests: successTests(),
    }),
    request({
      name: 'Bulk Enter Results',
      method: 'POST',
      path: 'traffic/results/bulk',
      body: jsonBody({
        rows: [{
          email: SEED.activeStudentEmail,
          examType: 'practical',
          passed: true,
          score: 90,
        }],
      }),
      tests: successTests(),
    }),
  ]),
  folder('Licenses', [
    request({
      name: 'Issue License',
      method: 'POST',
      path: 'traffic/licenses',
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          userId: '{{studentUserId}}',
          categoryCode: SEED.licenseCode,
          subTypeCode: SEED.subTypeCode,
          issueDate: '{{$isoTimestamp}}',
          certificateNumber: 'POSTMAN-CERT-001',
          enrollmentId: '{{enrollmentId}}',
        }, null, 2),
        options: { raw: { language: 'json' } },
      },
      tests: successTests(),
    }),
  ]),
], 'Traffic authority portal. Use `trafficToken`.', bearerAuth('trafficToken'));

const workflowsFolder = folder('10 - End-to-End Workflows', [
  folder('Enrollment Flow', [
    request({ name: '1. Login Registered Student', method: 'POST', path: 'auth/login', auth: { type: 'noauth' }, body: jsonBody({ email: SEED.studentEmail, password: SEED.password, portal: 'student' }), tests: loginTests('accessToken') }),
    request({ name: '2. List Schools Nearby', method: 'GET', path: 'schools/nearby', auth: { type: 'noauth' }, query: [['lat', SEED.damascusLat], ['lng', SEED.damascusLng]], tests: successTests(extractFirst('pm.response.json().data?.items || pm.response.json().data', 'schoolId')) }),
    request({ name: '3. Get School Courses', method: 'GET', path: 'schools/{{schoolId}}/courses', auth: { type: 'noauth' }, tests: successTests(extractFirst('pm.response.json().data?.courses || pm.response.json().data', 'courseId')) }),
    request({ name: '4. Create Enrollment', method: 'POST', path: 'enrollments', body: jsonBody({ courseId: '{{courseId}}', schoolId: '{{schoolId}}', categoryCode: 'B', subTypeCode: 'B1' }), tests: successTests("const e = pm.response.json().data?.enrollment; if (e?._id) pm.collectionVariables.set('enrollmentId', e._id);") }),
    request({ name: '5. Login Manager', method: 'POST', path: 'auth/login', auth: { type: 'noauth' }, body: jsonBody({ email: SEED.managerEmail, password: SEED.password, portal: 'school' }), tests: loginTests('accessToken') }),
    request({ name: '6. Accept Enrollment', method: 'POST', path: 'manager/enrollments/{{enrollmentId}}/accept', body: jsonBody({ paymentDeadlineDays: 7 }), tests: successTests() }),
    request({ name: '7. Login Student & Pay', method: 'POST', path: 'auth/login', auth: { type: 'noauth' }, body: jsonBody({ email: SEED.studentEmail, password: SEED.password, portal: 'student' }), tests: loginTests('accessToken') }),
    request({ name: '8. Initiate Payment', method: 'POST', path: 'enrollments/{{enrollmentId}}/payment/initiate', tests: successTests() }),
    request({ name: '9. Confirm Payment', method: 'POST', path: 'enrollments/{{enrollmentId}}/payment/confirm', body: jsonBody({ amount: 500000, gatewayRef: 'FLOW-MOCK-001' }), tests: successTests() }),
  ], 'Full enrollment: register → enroll → accept → pay'),
], 'Run with Collection Runner in order.');

const errorFolder = folder('11 - Error States', [
  request({ name: '401 - No Auth Token', method: 'GET', path: 'profile', auth: { type: 'noauth' }, tests: errorTests(401) }),
  request({ name: '401 - Invalid Token', method: 'GET', path: 'profile', auth: bearerAuth('invalid_token_xyz'), tests: errorTests(401) }),
  request({ name: '403 - Student on Admin Route', method: 'GET', path: 'admin/users', auth: bearerAuth('studentToken'), tests: errorTests(403) }),
  request({ name: '404 - School Not Found', method: 'GET', path: 'schools/000000000000000000000000', auth: { type: 'noauth' }, tests: errorTests(404) }),
  request({ name: '422 - Invalid Login Body', method: 'POST', path: 'auth/login', auth: { type: 'noauth' }, body: jsonBody({ email: 'not-an-email' }), tests: errorTests(422) }),
  request({ name: '422 - Missing Enrollment Fields', method: 'POST', path: 'enrollments', body: jsonBody({}), tests: errorTests(422) }),
], 'Common error responses for testing edge cases.');

// ─── Collection assembly ─────────────────────────────────────────────────────

const collection = {
  info: {
    _postman_id: 'drivehub-api-v1-collection',
    name: 'DriveHub API v1',
    description: `# DriveHub API — Complete Collection

**Base URL:** \`{{baseUrl}}\` (default: http://localhost:3000/api/v1)

## Prerequisites
1. MongoDB running
2. \`npm run seed:licenses\` (license catalog)
3. \`npm run seed:dev\` (demo schools, users, courses)
4. \`npm run seed:admin\` (admin account)
5. Backend: \`npm run dev\` on port 3000

## Demo Credentials (seed:dev)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@drivehub.local | AdminPass1! |
| Manager | manager@drivehub.local | StudentPass1! |
| Active Student | activestudent@drivehub.local | StudentPass1! |
| Student | student@drivehub.local | StudentPass1! |
| Coach | coach@drivehub.local | StudentPass1! |
| Traffic | traffic@drivehub.local | StudentPass1! |

## Usage
1. Import this collection + \`DriveHub_Local.postman_environment.json\`
2. Run folder **01 - Setup & Auth Tokens** first
3. Use role-specific folders (tokens auto-saved)
4. Run **10 - End-to-End Workflows** with Collection Runner

## Response Format
\`\`\`json
{ "success": true, "data": { ... }, "meta": { "pagination": { ... } } }
\`\`\`
Errors: \`{ "success": false, "error": { "code": "...", "message": "..." } }\`
`,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000/api/v1' },
    { key: 'accessToken', value: '' },
    { key: 'refreshToken', value: '' },
    { key: 'adminToken', value: '' },
    { key: 'managerToken', value: '' },
    { key: 'studentToken', value: '' },
    { key: 'registeredToken', value: '' },
    { key: 'coachToken', value: '' },
    { key: 'trafficToken', value: '' },
    { key: 'userId', value: '' },
    { key: 'schoolId', value: '' },
    { key: 'courseId', value: '' },
    { key: 'enrollmentId', value: '' },
    { key: 'managerCourseId', value: '' },
    { key: 'lessonId', value: '' },
    { key: 'coachId', value: '' },
    { key: 'studentUserId', value: '' },
    { key: 'instructorId', value: '' },
    { key: 'questionBankId', value: '' },
    { key: 'questionId', value: '' },
    { key: 'contentEditId', value: '' },
    { key: 'rosterId', value: '' },
    { key: 'rosterToken', value: '' },
    { key: 'scheduleId', value: '' },
    { key: 'notificationId', value: '' },
    { key: 'documentId', value: '' },
    { key: 'reviewId', value: '' },
    { key: 'adId', value: '' },
    { key: 'schoolApplicationId', value: '' },
    { key: 'adminSchoolId', value: '' },
    { key: 'targetUserId', value: '' },
    { key: 'practiceSessionId', value: '' },
    { key: 'theoryContentId', value: '' },
    { key: 'trafficRosterId', value: '' },
    { key: 'preRegistrationId', value: '' },
  ],
  auth: bearerAuth('accessToken'),
  event: [
    {
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: [
          "// Auto-set Authorization if accessToken exists and request has no explicit auth override",
        ],
      },
    },
  ],
  item: [
    setupFolder,
    publicFolder,
    authFolder,
    userFolder,
    studentFolder,
    coachFolder,
    managerFolder,
    adminFolder,
    trafficFolder,
    workflowsFolder,
    errorFolder,
  ],
};

const environment = {
  id: 'drivehub-local-env',
  name: 'DriveHub Local',
  values: [
    { key: 'baseUrl', value: 'http://localhost:3000/api/v1', enabled: true },
    { key: 'rootUrl', value: 'http://localhost:3000', enabled: true },
    { key: 'adminEmail', value: SEED.adminEmail, enabled: true },
    { key: 'adminPassword', value: SEED.adminPassword, enabled: true },
    { key: 'managerEmail', value: SEED.managerEmail, enabled: true },
    { key: 'studentEmail', value: SEED.studentEmail, enabled: true },
    { key: 'activeStudentEmail', value: SEED.activeStudentEmail, enabled: true },
    { key: 'coachEmail', value: SEED.coachEmail, enabled: true },
    { key: 'trafficEmail', value: SEED.trafficEmail, enabled: true },
    { key: 'demoPassword', value: SEED.password, enabled: true },
    { key: 'damascusLat', value: SEED.damascusLat, enabled: true },
    { key: 'damascusLng', value: SEED.damascusLng, enabled: true },
    { key: 'accessToken', value: '', enabled: true },
    { key: 'refreshToken', value: '', enabled: true },
    { key: 'schoolId', value: '', enabled: true },
    { key: 'courseId', value: '', enabled: true },
    { key: 'enrollmentId', value: '', enabled: true },
  ],
  _postman_variable_scope: 'environment',
};

// ─── Write files ─────────────────────────────────────────────────────────────

const collectionPath = path.join(OUT_DIR, 'DriveHub_API.postman_collection.json');
const envPath = path.join(OUT_DIR, 'DriveHub_Local.postman_environment.json');

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
fs.writeFileSync(envPath, JSON.stringify(environment, null, 2));

function countRequests(items) {
  let n = 0;
  for (const item of items) {
    if (item.request) n += 1;
    if (item.item) n += countRequests(item.item);
  }
  return n;
}

const total = countRequests(collection.item);
console.log(`Generated: ${collectionPath}`);
console.log(`Generated: ${envPath}`);
console.log(`Total requests: ${total}`);
