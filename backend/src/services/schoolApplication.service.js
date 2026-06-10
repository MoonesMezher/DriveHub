const { SchoolApplication, DrivingSchool, UserRole } = require('../models');
const { ROLES } = require('../constants/roles');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');

class SchoolApplicationService {
    async submit(applicantUserId, data) {
        const pending = await SchoolApplication.findOne({
            applicantUserId,
            status: 'pending',
        });
        if (pending) throw new ApiError(409, ERR.APPLICATION_PENDING_EXISTS);

        return SchoolApplication.create({
            ...data,
            applicantUserId,
            licenses: (data.licenses || []).map((l) => l.toUpperCase()),
        });
    }

    async listMine(applicantUserId) {
        return SchoolApplication.find({ applicantUserId })
            .sort({ createdAt: -1 })
            .lean();
    }

    async getById(id, applicantUserId = null) {
        const filter = { _id: id };
        if (applicantUserId) filter.applicantUserId = applicantUserId;
        const application = await SchoolApplication.findOne(filter).lean();
        if (!application) throw new ApiError(404, ERR.APPLICATION_NOT_FOUND);
        return application;
    }

    async listPending(query = {}) {
        const filter = { status: 'pending' };
        if (query.governorate) filter.governorate = query.governorate;
        return SchoolApplication.find(filter)
            .populate('applicantUserId', 'name email phone')
            .sort({ createdAt: 1 })
            .lean();
    }

    async review(applicationId, reviewerId, { status, rejectionReason = null }) {
        const application = await SchoolApplication.findById(applicationId);
        if (!application) throw new ApiError(404, ERR.APPLICATION_NOT_FOUND);
        if (application.status !== 'pending') {
            throw new ApiError(400, ERR.APPLICATION_ALREADY_REVIEWED);
        }

        application.status = status;
        application.reviewedBy = reviewerId;
        application.reviewedAt = new Date();
        application.rejectionReason = status === 'rejected' ? rejectionReason : null;

        if (status === 'approved') {
            const school = await DrivingSchool.create({
                name: application.schoolName,
                address: application.address,
                governorate: application.governorate,
                lat: application.lat,
                lng: application.lng,
                licenses: application.licenses,
                phone: application.phone,
                email: application.email,
                bankAccount: application.bankAccount,
                managerId: application.applicantUserId,
                status: 'active',
            });

            application.createdSchoolId = school._id;
            await application.save();

            await UserRole.findOneAndUpdate(
                {
                    userId: application.applicantUserId,
                    role: ROLES.MANAGER,
                    schoolId: school._id,
                },
                {
                    userId: application.applicantUserId,
                    role: ROLES.MANAGER,
                    schoolId: school._id,
                    grantedBy: reviewerId,
                    status: 'active',
                },
                { upsert: true, new: true },
            );
        } else {
            await application.save();
        }

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId: application.applicantUserId,
            type: NOTIFICATION_TYPES.GENERAL,
            title: status === 'approved' ? 'تمت الموافقة على طلب المدرسة' : 'تم رفض طلب المدرسة',
            message: status === 'approved'
                ? 'تم إنشاء مدرستك — يمكنك الدخول عبر بوابة المدرسة.'
                : (rejectionReason || 'لم تُقبل طلب تسجيل المدرسة.'),
            data: { applicationId: application._id, schoolId: application.createdSchoolId },
        });

        return application;
    }
}

module.exports = new SchoolApplicationService();
