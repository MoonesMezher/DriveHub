const mongoose = require('mongoose');
const { SchoolApplication, DrivingSchool, UserRole, DocumentUpload } = require('../models');
const { ROLES } = require('../constants/roles');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');

class SchoolApplicationService {
    _isTruthyQueryFlag(value) {
        return value === true || value === 1 || value === '1' || value === 'true';
    }

    _toOwner(applicant) {
        if (!applicant || typeof applicant !== 'object' || !applicant._id) {
            return {};
        }
        return applicant;
    }

    _toComplianceSummary(application) {
        const owner = this._toOwner(application.applicantUserId);
        return {
            id: application._id,
            type: 'school_onboarding',
            status: application.status,
            schoolName: application.schoolName,
            city: application.governorate || null,
            ownerName: owner.name || null,
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
        };
    }

    _extractNationalId(profileData = {}) {
        if (!profileData || typeof profileData !== 'object') return null;
        return profileData.nationalId
            || profileData.nationalID
            || profileData.national_id
            || profileData.idNumber
            || profileData.nationalNumber
            || null;
    }

    _validObjectIds(values = []) {
        return (values || []).filter((value) => mongoose.isValidObjectId(value));
    }

    async submit(applicantUserId, data) {
        const settingsService = require('./settings.service');
        if (await settingsService.isRegistrationPaused()) {
            throw new ApiError(400, ERR.PLATFORM_REGISTRATION_PAUSED);
        }

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
            .populate({ path: 'applicantUserId', select: 'name email phone' })
            .sort({ createdAt: 1 })
            .lean();
    }

    async listComplianceRequests(query = {}) {
        const statuses = ['pending'];
        if (this._isTruthyQueryFlag(query.includeHistory)) {
            statuses.push('approved', 'rejected');
        }

        const filter = { status: { $in: statuses } };
        if (query.governorate) filter.governorate = query.governorate;

        const applications = await SchoolApplication.find(filter)
            .populate({ path: 'applicantUserId', select: 'name email phone', options: { strictPopulate: false } })
            .sort({ createdAt: 1 })
            .lean();

        return applications.map((application) => this._toComplianceSummary(application));
    }

    async getComplianceRequestById(id) {
        const application = await SchoolApplication.findById(id)
            .select('+bankAccount')
            .populate({ path: 'applicantUserId', select: 'name email phone profileData', options: { strictPopulate: false } })
            .populate({ path: 'reviewedBy', select: 'name email', options: { strictPopulate: false } })
            .populate({ path: 'createdSchoolId', select: 'name governorate status createdAt', options: { strictPopulate: false } })
            .lean();

        if (!application) throw new ApiError(404, ERR.APPLICATION_NOT_FOUND);

        const documentIds = this._validObjectIds(application.documents);
        const documents = documentIds.length
            ? await DocumentUpload.find({ _id: { $in: documentIds } })
                .select('type mime originalName size uploadedAt createdAt')
                .lean()
            : [];

        const owner = this._toOwner(application.applicantUserId);
        const ownerNationalId = this._extractNationalId(owner.profileData);

        return {
            id: application._id,
            type: 'school_onboarding',
            status: application.status,
            rejectionReason: application.rejectionReason,
            createdAt: application.createdAt,
            updatedAt: application.updatedAt,
            reviewedAt: application.reviewedAt,
            school: {
                name: application.schoolName,
                legalName: application.schoolName,
                address: application.address,
                city: application.governorate || null,
                licenseNumber: application.licenses?.join(', ') || null,
                vehiclesCount: null,
                categories: application.licenses || [],
                phone: application.phone || null,
                email: application.email || null,
                lat: application.lat,
                lng: application.lng,
            },
            owner: {
                userId: owner._id || null,
                name: owner.name || null,
                nationalId: ownerNationalId,
                phone: owner.phone || null,
                email: owner.email || null,
            },
            bank: {
                accountName: owner.name || null,
                iban: application.bankAccount || null,
                accountNumber: application.bankAccount || null,
                bankName: null,
            },
            documents,
            reviewer: application.reviewedBy || null,
            createdSchool: application.createdSchoolId || null,
        };
    }

    async approveComplianceRequest(applicationId, reviewerId) {
        return this.review(applicationId, reviewerId, { status: 'approved' });
    }

    async rejectComplianceRequest(applicationId, reviewerId, rejectionReason) {
        return this.review(applicationId, reviewerId, { status: 'rejected', rejectionReason });
    }

    async review(applicationId, reviewerId, { status, rejectionReason = null }) {
        const application = await SchoolApplication.findById(applicationId).select('+bankAccount');
        if (!application) throw new ApiError(404, ERR.APPLICATION_NOT_FOUND);
        if (application.status !== 'pending') {
            throw new ApiError(400, ERR.APPLICATION_ALREADY_REVIEWED);
        }
        if (!application.applicantUserId) {
            throw new ApiError(400, ERR.APPLICATION_NOT_FOUND);
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
