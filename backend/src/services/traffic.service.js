const {
    StudentRoster,
    TrafficExamSchedule,
    TrafficExamResult,
    DrivingLicenseRecord,
    Enrollment,
    User,
} = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');

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

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId: data.studentId,
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

        if (data.passed && data.examType === 'theory') {
            enrollment.status = ENROLLMENT_STATUS.FINAL_THEORY_PASSED;
            await enrollment.save();
        } else if (data.passed && data.examType === 'practical') {
            enrollment.status = ENROLLMENT_STATUS.FINAL_PASSED;
            await enrollment.save();
        } else if (!data.passed) {
            enrollment.status = ENROLLMENT_STATUS.FINAL_FAILED_THEORY;
            await enrollment.save();
        }

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId: data.studentId,
            type: NOTIFICATION_TYPES.EXAM_RESULT,
            title: data.passed ? 'نجحت في امتحان المرور' : 'لم تنجح في امتحان المرور',
            message: `نتيجة امتحان ${data.examType === 'theory' ? 'النظري' : 'العملي'}: ${data.passed ? 'ناجح' : 'راسب'}`,
            data: { resultId: result._id },
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

        if (data.enrollmentId) {
            await Enrollment.findByIdAndUpdate(data.enrollmentId, {
                status: ENROLLMENT_STATUS.COMPLETED,
            });
        }

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId: data.userId,
            type: NOTIFICATION_TYPES.GENERAL,
            title: 'تم إصدار الرخصة',
            message: `تم إصدار رخصة فئة ${data.categoryCode} بنجاح.`,
            data: { licenseRecordId: record._id },
        });

        return record;
    }
}

module.exports = new TrafficService();
