const {
    StudentRoster,
    TrafficExamSchedule,
    TrafficExamResult,
    DrivingLicenseRecord,
    DrivingSchool,
    Enrollment,
    User,
} = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const { resolveTrafficResultStatus } = require('../helpers/trafficResult.helper');
const { sendInstant } = require('../helpers/notificationDelivery.helper');

class TrafficService {
    async listRosters(query = {}) {
        const filter = { status: 'distributed' };
        if (query.schoolId) filter.schoolId = query.schoolId;
        if (query.trafficBatchId) filter.trafficBatchId = query.trafficBatchId;

        return StudentRoster.find(filter)
            .populate('schoolId', 'name governorate')
            .populate('courseId', 'categoryCode launchDate')
            .sort({ submittedAt: -1 })
            .lean();
    }

    async getRoster(id) {
        const roster = await StudentRoster.findById(id)
            .populate('schoolId', 'name address governorate phone')
            .populate('courseId', 'categoryCode subTypeCode launchDate')
            .populate('studentIds', 'name email phone')
            .lean();
        if (!roster) throw new ApiError(404, ERR.ROSTER_NOT_FOUND);
        return roster;
    }

    async listSchedules(query = {}) {
        const filter = {};
        if (query.governorate) filter.governorate = query.governorate;
        if (query.studentId) filter.studentId = query.studentId;
        if (query.status) filter.status = query.status;
        if (query.examType) filter.examType = query.examType;
        if (query.from) filter.examDate = { $gte: new Date(query.from) };
        if (query.to) {
            filter.examDate = { ...filter.examDate, $lte: new Date(query.to) };
        }

        return TrafficExamSchedule.find(filter)
            .populate('studentId', 'name email')
            .sort({ examDate: 1 })
            .limit(100)
            .lean();
    }

    async createSchedule(scheduledBy, data) {
        const enrollment = await Enrollment.findById(data.enrollmentId);
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        const examDate = new Date(data.examDate);
        const conflict = await TrafficExamSchedule.findOne({
            studentId: data.studentId,
            examDate,
            status: 'scheduled',
        });
        if (conflict) throw new ApiError(409, ERR.SCHEDULE_CONFLICT);

        const schedule = await TrafficExamSchedule.create({
            ...data,
            examDate,
            scheduledBy,
            status: 'scheduled',
            visibleToStudent: true,
        });

        await sendInstant(data.studentId, {
            type: NOTIFICATION_TYPES.EXAM_SCHEDULED,
            title: 'تم تحديد موعد امتحان المرور',
            message: `موعد ${data.examType === 'theory' ? 'النظري' : 'العملي'}: ${examDate.toLocaleDateString('ar-SY')}`,
            data: { scheduleId: schedule._id, examDate },
        });

        return schedule;
    }

    async updateSchedule(id, data) {
        const schedule = await TrafficExamSchedule.findById(id);
        if (!schedule) throw new ApiError(404, ERR.SCHEDULE_NOT_FOUND);

        const allowed = ['examDate', 'branch', 'status', 'visibleToStudent', 'governorate'];
        for (const key of allowed) {
            if (data[key] !== undefined) schedule[key] = data[key];
        }
        await schedule.save();
        return schedule;
    }

    _normalizePassed(value) {
        if (typeof value === 'boolean') return value;
        const v = String(value).trim().toLowerCase();
        if (['true', '1', 'yes', 'y', 'ناجح', 'نعم', 'نجح'].includes(v)) return true;
        if (['false', '0', 'no', 'n', 'راسب', 'لا', 'فشل'].includes(v)) return false;
        return null;
    }

    _normalizeExamType(value) {
        const v = String(value).trim().toLowerCase();
        if (['theory', 'نظري'].includes(v)) return 'theory';
        if (['practical', 'عملي'].includes(v)) return 'practical';
        return null;
    }

    async _resolveEnrollmentForImport(row) {
        if (row.enrollmentId) {
            const enrollment = await Enrollment.findById(row.enrollmentId);
            if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);
            return enrollment;
        }

        if (!row.studentEmail) {
            throw new ApiError(400, 'البريد الإلكتروني أو معرّف الاشتراك مطلوب');
        }

        const email = String(row.studentEmail).trim().toLowerCase();
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError(404, `لا يوجد مستخدم بالبريد: ${email}`);
        }

        const categoryCode = row.categoryCode
            ? String(row.categoryCode).trim().toUpperCase()
            : null;
        const filter = { userId: user._id };
        if (categoryCode) filter.categoryCode = categoryCode;

        const enrollment = await Enrollment.findOne(filter).sort({ updatedAt: -1 });
        if (!enrollment) {
            const categoryHint = categoryCode ? ` وفئة ${categoryCode}` : '';
            throw new ApiError(404, `لا يوجد اشتراك للبريد ${email}${categoryHint}`);
        }
        return enrollment;
    }

    async bulkEnterResults(enteredBy, rows = []) {
        const summary = { imported: 0, failed: 0, errors: [] };

        for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            const rowNumber = index + 2;
            try {
                const examType = this._normalizeExamType(row.examType);
                const passed = this._normalizePassed(row.passed);
                if (!examType) throw new ApiError(400, 'نوع الامتحان غير صالح');
                if (passed === null) throw new ApiError(400, 'النتيجة غير صالحة');

                const enrollment = await this._resolveEnrollmentForImport(row);

                await this.enterResult(enteredBy, {
                    studentId: enrollment.userId,
                    enrollmentId: enrollment._id,
                    examType,
                    passed,
                    ...(row.score != null && row.score !== '' ? { score: Number(row.score) } : {}),
                    ...(row.scheduleId ? { scheduleId: row.scheduleId } : {}),
                    ...(row.notes ? { notes: String(row.notes).trim() } : {}),
                });

                summary.imported += 1;
            } catch (err) {
                summary.failed += 1;
                summary.errors.push({
                    row: rowNumber,
                    message: err.message || 'فشل إدخال الصف',
                });
            }
        }

        return summary;
    }

    async enterResult(enteredBy, data) {
        const enrollment = await Enrollment.findById(data.enrollmentId);
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        const result = await TrafficExamResult.create({
            ...data,
            enteredBy,
            resultDate: new Date(),
        });

        if (data.scheduleId) {
            await TrafficExamSchedule.findByIdAndUpdate(data.scheduleId, { status: 'completed' });
        }

        const statusUpdate = resolveTrafficResultStatus(enrollment, {
            examType: data.examType,
            passed: data.passed,
        });
        if (statusUpdate) {
            enrollment.status = statusUpdate.status;
            if (statusUpdate.retakeScope) {
                enrollment.retakeScope = statusUpdate.retakeScope;
            }
            if (statusUpdate.needsRetakeScope) {
                const enrollmentService = require('./enrollment.service');
                enrollment.retakeScope = await enrollmentService.deriveRetakeScope(enrollment, {
                    enrollmentId: enrollment._id,
                    theoryPassed: true,
                    practicalPassed: false,
                });
            }
            await enrollment.save();
        }

        await sendInstant(data.studentId, {
            type: NOTIFICATION_TYPES.EXAM_RESULT,
            title: data.passed ? 'نجحت في امتحان المرور' : 'لم تنجح في امتحان المرور',
            message: `نتيجة امتحان ${data.examType === 'theory' ? 'النظري' : 'العملي'}: ${data.passed ? 'ناجح' : 'راسب'}`,
            data: { resultId: result._id, enrollmentId: enrollment._id },
        });

        return result;
    }

    async listResults(query = {}) {
        const filter = {};
        if (query.studentId) filter.studentId = query.studentId;
        if (query.enrollmentId) filter.enrollmentId = query.enrollmentId;
        if (query.examType) filter.examType = query.examType;
        if (query.passed !== undefined) filter.passed = query.passed === 'true' || query.passed === true;

        return TrafficExamResult.find(filter)
            .populate('studentId', 'name')
            .sort({ resultDate: -1 })
            .limit(100)
            .lean();
    }

    async listPortalEnrollments(query = {}) {
        const filter = {
            status: {
                $in: [
                    ENROLLMENT_STATUS.ACTIVE,
                    ENROLLMENT_STATUS.EXAM_PENDING,
                    ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
                    ENROLLMENT_STATUS.FINAL_PASSED,
                    ENROLLMENT_STATUS.COMPLETED,
                ],
            },
        };
        if (query.schoolId) filter.schoolId = query.schoolId;

        return Enrollment.find(filter)
            .populate('userId', 'name email phone')
            .populate('schoolId', 'name governorate')
            .sort({ updatedAt: -1 })
            .limit(Math.min(Number(query.limit) || 200, 500))
            .lean();
    }

    async issueLicenseRecord(issuedBy, data) {
        const user = await User.findById(data.userId);
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);

        const existing = await DrivingLicenseRecord.findOne({
            userId: data.userId,
            categoryCode: data.categoryCode.toUpperCase(),
            subTypeCode: data.subTypeCode?.toUpperCase() || null,
        });
        if (existing) throw new ApiError(409, ERR.LICENSE_RECORD_EXISTS);

        const record = await DrivingLicenseRecord.create({
            ...data,
            categoryCode: data.categoryCode.toUpperCase(),
            subTypeCode: data.subTypeCode?.toUpperCase() || null,
            issuer: 'وزارة النقل',
            details: { issuedBy },
        });

        const verificationService = require('./verification.service');
        await verificationService.ensureCertificateToken(record._id);

        if (data.enrollmentId) {
            await Enrollment.findByIdAndUpdate(data.enrollmentId, {
                status: ENROLLMENT_STATUS.COMPLETED,
            });
        }

        await sendInstant(data.userId, {
            type: NOTIFICATION_TYPES.GENERAL,
            title: 'تم إصدار الرخصة',
            message: `تم إصدار رخصة فئة ${data.categoryCode} بنجاح.`,
            data: { licenseRecordId: record._id },
        });

        return record;
    }

    async getDashboard(query = {}) {
        const platformService = require('./platform.service');
        const platform = await platformService.getReports(query);

        const [
            rostersDistributed,
            rostersPending,
            schedulesTotal,
            schedulesUpcoming,
            resultsTotal,
            resultsPassed,
            licensesIssued,
            examReadyEnrollments,
            schoolsByGovernorate,
        ] = await Promise.all([
            StudentRoster.countDocuments({ status: 'distributed' }),
            StudentRoster.countDocuments({ status: { $in: ['submitted', 'draft'] } }),
            TrafficExamSchedule.countDocuments(),
            TrafficExamSchedule.countDocuments({
                status: 'scheduled',
                examDate: { $gte: new Date() },
            }),
            TrafficExamResult.countDocuments(),
            TrafficExamResult.countDocuments({ passed: true }),
            DrivingLicenseRecord.countDocuments(),
            Enrollment.countDocuments({
                status: {
                    $in: [
                        ENROLLMENT_STATUS.EXAM_PENDING,
                        ENROLLMENT_STATUS.FINAL_THEORY_PASSED,
                        ENROLLMENT_STATUS.ACTIVE,
                    ],
                },
            }),
            DrivingSchool.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: '$governorate', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        return {
            platform,
            operations: {
                rostersDistributed,
                rostersPending,
                schedulesTotal,
                schedulesUpcoming,
                resultsTotal,
                resultsPassed,
                resultsFailed: Math.max(0, resultsTotal - resultsPassed),
                licensesIssued,
                examReadyEnrollments,
            },
            schoolsByGovernorate: schoolsByGovernorate.map((row) => ({
                governorate: row._id || 'غير محدد',
                count: row.count,
            })),
        };
    }
}

module.exports = new TrafficService();
