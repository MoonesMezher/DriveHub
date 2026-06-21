const {
    User,
    DrivingSchool,
    LicenseCategory,
    TheoryContent,
    PracticalVideo,
    PracticalLesson,
    Notification,
    Enrollment,
    TrainingCourse,
    Instructor,
    CoachNote,
    StudentRoster,
    SchoolApplication,
    AuditLog,
    TrafficExamSchedule,
    TrafficExamResult,
} = require('../models');
const { ROLES } = require('../constants/roles');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');

const LIMIT_PER_GROUP = 5;
const MAX_RESULTS = 24;

const makeRegex = (query) => {
    const trimmed = String(query || '').trim();
    if (trimmed.length < 2) return null;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, 'i');
};

const toResult = (id, type, title, subtitle, href, icon) => ({
    id: String(id),
    type,
    title,
    subtitle,
    href,
    icon,
});

const dedupeAndCap = (items) => {
    const seen = new Set();
    const out = [];
    for (const item of items) {
        const key = `${item.type}:${item.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
        if (out.length >= MAX_RESULTS) break;
    }
    return out;
};

class SearchService {
    async searchNotifications(userId, regex) {
        const rows = await Notification.find({
            userId,
            $or: [{ title: regex }, { message: regex }],
        })
            .sort({ createdAt: -1 })
            .limit(LIMIT_PER_GROUP)
            .lean();

        return rows.map((n) =>
            toResult(n._id, 'notification', n.title, n.message, '/notifications', 'notifications'),
        );
    }

    async searchSchools(regex, hrefPrefix = '/schools') {
        const rows = await DrivingSchool.find({
            status: 'active',
            $or: [
                { name: regex },
                { address: regex },
                { governorate: regex },
                { email: regex },
            ],
        })
            .limit(LIMIT_PER_GROUP)
            .lean();

        return rows.map((s) =>
            toResult(
                s._id,
                'school',
                s.name,
                [s.governorate, s.address].filter(Boolean).join(' — '),
                `${hrefPrefix}/${s._id}`,
                'domain',
            ),
        );
    }

    async searchLicenses(regex) {
        const rows = await LicenseCategory.find({
            $or: [{ name: regex }, { code: regex }, { briefDesc: regex }],
        })
            .sort({ order: 1 })
            .limit(LIMIT_PER_GROUP)
            .lean();

        return rows.map((l) =>
            toResult(l._id, 'license', `${l.name} (${l.code})`, l.briefDesc || '', `/licenses/${l.code}`, 'badge'),
        );
    }

    async searchForRegistered(userId, regex) {
        const [schools, licenses, notifications] = await Promise.all([
            this.searchSchools(regex),
            this.searchLicenses(regex),
            this.searchNotifications(userId, regex),
        ]);
        return dedupeAndCap([...schools, ...licenses, ...notifications]);
    }

    async searchForStudent(userId, regex) {
        const [theory, videos, lessons, notifications, schools] = await Promise.all([
            TheoryContent.find({
                isActive: true,
                $or: [{ title: regex }, { body: regex }],
            })
                .limit(LIMIT_PER_GROUP)
                .lean(),
            PracticalVideo.find({
                isActive: true,
                title: regex,
            })
                .limit(LIMIT_PER_GROUP)
                .lean(),
            PracticalLesson.find({ studentId: userId })
                .populate('coachId', 'name')
                .sort({ scheduledAt: -1 })
                .limit(20)
                .lean()
                .then((rows) =>
                    rows
                        .filter((l) => regex.test(l.coachId?.name || '') || regex.test(l.coachNotes || ''))
                        .slice(0, LIMIT_PER_GROUP),
                ),
            this.searchNotifications(userId, regex),
            this.searchSchools(regex),
        ]);

        const theoryResults = theory.map((t) =>
            toResult(
                t._id,
                'theory',
                t.title,
                `فئة ${t.categoryCode} — مرحلة ${t.phase}`,
                '/student/theory',
                'menu_book',
            ),
        );

        const videoResults = videos.map((v) =>
            toResult(
                v._id,
                'video',
                v.title,
                `فئة ${v.categoryCode}`,
                '/student/videos',
                'play_circle',
            ),
        );

        const lessonResults = lessons.map((l) =>
            toResult(
                l._id,
                'lesson',
                l.coachId?.name || 'موعد تدريب',
                new Date(l.scheduledAt).toLocaleString('en-GB'),
                '/student/lessons',
                'calendar_today',
            ),
        );

        return dedupeAndCap([...theoryResults, ...videoResults, ...lessonResults, ...notifications, ...schools]);
    }

    async searchForCoach(userId, schoolId, regex) {
        const instructor = await Instructor.findOne({ userId, status: 'active' }).lean();
        const scopedSchoolId = schoolId || instructor?.schoolId;

        const [students, notes, lessons, notifications] = await Promise.all([
            PracticalLesson.find({ coachId: userId })
                .populate('studentId', 'name email phone')
                .limit(50)
                .lean()
                .then((rows) => {
                    const map = new Map();
                    rows.forEach((l) => {
                        const s = l.studentId;
                        if (!s) return;
                        const hay = `${s.name} ${s.email} ${s.phone || ''}`;
                        if (regex.test(hay)) map.set(String(s._id), s);
                    });
                    return [...map.values()].slice(0, LIMIT_PER_GROUP);
                }),
            CoachNote.find({ coachId: userId, personalNotes: regex })
                .populate('studentId', 'name')
                .limit(LIMIT_PER_GROUP)
                .lean(),
            PracticalLesson.find({ coachId: userId })
                .populate('studentId', 'name')
                .sort({ scheduledAt: -1 })
                .limit(20)
                .lean()
                .then((rows) =>
                    rows.filter((l) => regex.test(l.studentId?.name || '')).slice(0, LIMIT_PER_GROUP),
                ),
            this.searchNotifications(userId, regex),
        ]);

        const studentResults = students.map((s) =>
            toResult(s._id, 'student', s.name, s.email, '/coach/students', 'person'),
        );

        const noteResults = notes.map((n) =>
            toResult(
                n._id,
                'note',
                n.studentId?.name || 'ملاحظة',
                n.personalNotes?.slice(0, 80) || '',
                '/coach/notes',
                'edit_note',
            ),
        );

        const lessonResults = lessons.map((l) =>
            toResult(
                l._id,
                'lesson',
                l.studentId?.name || 'درس عملي',
                new Date(l.scheduledAt).toLocaleString('en-GB'),
                '/coach/schedule',
                'calendar_month',
            ),
        );

        let schoolResults = [];
        if (scopedSchoolId) {
            const school = await DrivingSchool.findOne({
                _id: scopedSchoolId,
                $or: [{ name: regex }, { address: regex }, { governorate: regex }],
            }).lean();
            if (school) {
                schoolResults = [
                    toResult(school._id, 'school', school.name, school.governorate || '', '/coach', 'domain'),
                ];
            }
        }

        return dedupeAndCap([
            ...studentResults,
            ...noteResults,
            ...lessonResults,
            ...schoolResults,
            ...notifications,
        ]);
    }

    async searchForManager(userId, schoolId, regex) {
        if (!schoolId) return this.searchNotifications(userId, regex);

        const matchingUsers = await User.find({
            $or: [{ name: regex }, { email: regex }, { phone: regex }],
        })
            .select('_id name email')
            .limit(30)
            .lean();

        const userIds = matchingUsers.map((u) => u._id);

        const enrollmentFilter = {
            schoolId,
            ...(userIds.length
                ? { userId: { $in: userIds } }
                : { $or: [{ categoryCode: regex }, { status: regex }] }),
        };

        const [courses, enrollments, instructors, rosters, school, notifications] = await Promise.all([
            TrainingCourse.find({
                schoolId,
                $or: [{ categoryCode: regex }, { subTypeCode: regex }, { status: regex }],
            })
                .limit(LIMIT_PER_GROUP)
                .lean(),
            Enrollment.find(enrollmentFilter)
                .populate('userId', 'name email')
                .limit(LIMIT_PER_GROUP)
                .lean(),
            Instructor.find({ schoolId, status: 'active' })
                .populate('userId', 'name email phone')
                .limit(30)
                .lean()
                .then((rows) =>
                    rows
                        .filter((i) => regex.test(i.userId?.name || '') || regex.test(i.userId?.email || ''))
                        .slice(0, LIMIT_PER_GROUP),
                ),
            StudentRoster.find({ schoolId })
                .populate('schoolId', 'name')
                .sort({ updatedAt: -1 })
                .limit(20)
                .lean()
                .then((rows) =>
                    rows
                        .filter((r) => regex.test(r.schoolId?.name || '') || regex.test(r.trafficBatchId || ''))
                        .slice(0, LIMIT_PER_GROUP),
                ),
            DrivingSchool.findOne({
                _id: schoolId,
                $or: [{ name: regex }, { address: regex }, { governorate: regex }],
            }).lean(),
            this.searchNotifications(userId, regex),
        ]);

        const courseResults = courses.map((c) =>
            toResult(
                c._id,
                'course',
                `دورة ${c.categoryCode}${c.subTypeCode ? ` (${c.subTypeCode})` : ''}`,
                c.status,
                '/manager/courses',
                'school',
            ),
        );

        const enrollmentResults = enrollments.map((e) =>
            toResult(
                e._id,
                'enrollment',
                e.userId?.name || 'طالب',
                `${e.categoryCode} — ${e.status}`,
                '/manager/enrollments',
                'person_add',
            ),
        );

        const instructorResults = instructors.map((i) =>
            toResult(
                i._id,
                'instructor',
                i.userId?.name || 'مدرب',
                i.userId?.email || '',
                '/manager/instructors',
                'supervisor_account',
            ),
        );

        const rosterResults = rosters.map((r) =>
            toResult(
                r._id,
                'roster',
                r.schoolId?.name || 'قائمة طلاب',
                r.trafficBatchId || r.status,
                '/manager/roster',
                'upload_file',
            ),
        );

        const schoolResults = school
            ? [toResult(school._id, 'school', school.name, school.governorate || '', '/manager', 'domain')]
            : [];

        return dedupeAndCap([
            ...courseResults,
            ...enrollmentResults,
            ...instructorResults,
            ...rosterResults,
            ...schoolResults,
            ...notifications,
        ]);
    }

    async searchForAdmin(regex) {
        const [schools, users, applications, audits, licenses] = await Promise.all([
            DrivingSchool.find({
                $or: [
                    { name: regex },
                    { address: regex },
                    { governorate: regex },
                    { email: regex },
                ],
            })
                .limit(LIMIT_PER_GROUP)
                .lean(),
            User.find({
                $or: [{ name: regex }, { email: regex }, { phone: regex }],
            })
                .limit(LIMIT_PER_GROUP)
                .lean(),
            SchoolApplication.find({
                $or: [
                    { schoolName: regex },
                    { email: regex },
                    { governorate: regex },
                    { address: regex },
                ],
            })
                .limit(LIMIT_PER_GROUP)
                .lean(),
            AuditLog.find({
                $or: [{ action: regex }, { path: regex }, { entityType: regex }],
            })
                .sort({ createdAt: -1 })
                .limit(LIMIT_PER_GROUP)
                .lean(),
            LicenseCategory.find({
                $or: [{ name: regex }, { code: regex }, { briefDesc: regex }],
            })
                .limit(LIMIT_PER_GROUP)
                .lean(),
        ]);

        return dedupeAndCap([
            ...schools.map((s) =>
                toResult(s._id, 'school', s.name, s.governorate || '', `/admin/schools`, 'domain'),
            ),
            ...users.map((u) =>
                toResult(u._id, 'user', u.name, u.email, '/admin/users', 'manage_accounts'),
            ),
            ...applications.map((a) =>
                toResult(
                    a._id,
                    'application',
                    a.schoolName,
                    `${a.governorate || ''} — ${a.status}`,
                    '/admin/compliance',
                    'verified_user',
                ),
            ),
            ...audits.map((a) =>
                toResult(a._id, 'audit', a.action, a.path || a.entityType || '', '/admin/audit', 'history'),
            ),
            ...licenses.map((l) =>
                toResult(l._id, 'license', `${l.name} (${l.code})`, l.briefDesc || '', '/admin/pricing', 'badge'),
            ),
        ]);
    }

    async searchForTraffic(regex) {
        const matchingUsers = await User.find({
            $or: [{ name: regex }, { email: regex }, { phone: regex }],
        })
            .select('_id name email')
            .limit(40)
            .lean();
        const userIds = matchingUsers.map((u) => u._id);

        const [rosters, schedules, results, enrollments, schools] = await Promise.all([
            StudentRoster.find({ status: 'distributed' })
                .populate('schoolId', 'name governorate')
                .populate('courseId', 'categoryCode subTypeCode')
                .sort({ submittedAt: -1 })
                .limit(30)
                .lean()
                .then((rows) =>
                    rows
                        .filter(
                            (r) =>
                                regex.test(r.schoolId?.name || '')
                                || regex.test(r.trafficBatchId || '')
                                || regex.test(r.courseId?.categoryCode || ''),
                        )
                        .slice(0, LIMIT_PER_GROUP),
                ),
            TrafficExamSchedule.find(
                userIds.length ? { studentId: { $in: userIds } } : { _id: null },
            )
                .populate('studentId', 'name email')
                .sort({ examDate: -1 })
                .limit(LIMIT_PER_GROUP)
                .lean(),
            TrafficExamResult.find(
                userIds.length ? { studentId: { $in: userIds } } : { _id: null },
            )
                .populate('studentId', 'name')
                .sort({ resultDate: -1 })
                .limit(LIMIT_PER_GROUP)
                .lean(),
            Enrollment.find(
                userIds.length ? { userId: { $in: userIds } } : { _id: null },
            )
                .populate('userId', 'name email')
                .populate('schoolId', 'name')
                .limit(LIMIT_PER_GROUP)
                .lean(),
            DrivingSchool.find({
                status: 'active',
                $or: [
                    { name: regex },
                    { governorate: regex },
                    { address: regex },
                    { email: regex },
                ],
            })
                .limit(LIMIT_PER_GROUP)
                .lean(),
        ]);

        return dedupeAndCap([
            ...rosters.map((r) =>
                toResult(
                    r._id,
                    'roster',
                    r.schoolId?.name || 'قائمة',
                    r.trafficBatchId || `${r.studentIds?.length || 0} طالب`,
                    '/traffic/rosters',
                    'list_alt',
                ),
            ),
            ...schedules.map((s) =>
                toResult(
                    s._id,
                    'schedule',
                    s.studentId?.name || 'موعد امتحان',
                    `${s.examType} — ${new Date(s.examDate).toLocaleString('en-GB')}`,
                    '/traffic/schedules',
                    'event',
                ),
            ),
            ...results.map((r) =>
                toResult(
                    r._id,
                    'result',
                    r.studentId?.name || 'نتيجة',
                    `${r.examType} — ${r.passed ? 'ناجح' : 'راسب'}`,
                    '/traffic/results',
                    'assignment_turned_in',
                ),
            ),
            ...enrollments.map((e) =>
                toResult(
                    e._id,
                    'enrollment',
                    e.userId?.name || 'طالب',
                    `${e.schoolId?.name || ''} — ${e.categoryCode}`,
                    '/traffic/results',
                    'person',
                ),
            ),
            ...schools.map((s) =>
                toResult(s._id, 'school', s.name, s.governorate || '', '/traffic/rosters', 'domain'),
            ),
        ]);
    }

    async search({ role, userId, schoolId, query }) {
        const regex = makeRegex(query);
        if (!regex) return { results: [], query: '' };

        let results = [];

        switch (role) {
            case ROLES.STUDENT:
                results = await this.searchForStudent(userId, regex);
                break;
            case ROLES.COACH:
                results = await this.searchForCoach(userId, schoolId, regex);
                break;
            case ROLES.MANAGER:
                results = await this.searchForManager(userId, schoolId, regex);
                break;
            case ROLES.ADMIN:
                results = await this.searchForAdmin(regex);
                break;
            case ROLES.TRAFFIC:
                results = await this.searchForTraffic(regex);
                break;
            case ROLES.REGISTERED:
            default:
                results = await this.searchForRegistered(userId, regex);
                break;
        }

        return { results, query: String(query).trim() };
    }
}

module.exports = new SearchService();
