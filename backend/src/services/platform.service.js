const {
    PlatformPricing,
    DrivingSchool,
    User,
    UserRole,
    Ad,
    Enrollment,
    Payment,
    StudentRoster,
} = require('../models');
const { ROLES } = require('../constants/roles');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const config = require('../config');
const passwordService = require('../utils/passwordService');
const rosterService = require('./roster.service');
const mediaService = require('./media.service');

class PlatformService {
    async listPricing() {
        return PlatformPricing.find({ isActive: true })
            .sort({ categoryCode: 1, effectiveFrom: -1 })
            .lean();
    }

    async upsertPricing(data, adminId) {
        const categoryCode = data.categoryCode.toUpperCase();
        const subTypeCode = data.subTypeCode?.toUpperCase() || null;

        if (data.isActive !== false) {
            await PlatformPricing.updateMany(
                { categoryCode, subTypeCode, isActive: true },
                { isActive: false },
            );
        }

        return PlatformPricing.create({
            ...data,
            categoryCode,
            subTypeCode,
            updatedBy: adminId,
            isActive: data.isActive !== false,
        });
    }

    async updateCommission({ commission }) {
        config.platform.commission = commission;
        return { commission: config.platform.commission };
    }

    async listSchools(query = {}) {
        const filter = {};
        if (query.status) filter.status = query.status;
        if (query.governorate) filter.governorate = query.governorate;
        if (query.search) {
            filter.name = { $regex: query.search, $options: 'i' };
        }
        const page = Number(query.page) || 1;
        const limit = Math.min(Number(query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        const [schools, total] = await Promise.all([
            DrivingSchool.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            DrivingSchool.countDocuments(filter),
        ]);

        return { schools, total, page, limit };
    }

    async createSchool(data) {
        return DrivingSchool.create({
            ...data,
            licenses: (data.licenses || []).map((l) => l.toUpperCase()),
            status: 'active',
        });
    }

    async updateSchool(id, data) {
        const updates = { ...data };
        if (updates.licenses) {
            updates.licenses = updates.licenses.map((l) => l.toUpperCase());
        }
        const school = await DrivingSchool.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!school) throw new ApiError(404, ERR.SCHOOL_NOT_FOUND);
        return school;
    }

    async suspendSchool(id, { status = 'suspended' } = {}) {
        return this.updateSchool(id, { status });
    }

    async deleteSchool(id) {
        const { TrainingCourse, Enrollment } = require('../models');
        const { COURSE_STATUS } = require('../constants/courseStatus');
        const enrollmentHelper = require('../helpers/enrollment.helper');

        const school = await DrivingSchool.findById(id);
        if (!school || school.status === 'deleted') {
            throw new ApiError(404, ERR.SCHOOL_NOT_FOUND);
        }

        const activeCourse = await TrainingCourse.findOne({
            schoolId: id,
            status: { $in: [COURSE_STATUS.REGISTRATION_OPEN, COURSE_STATUS.ACTIVE] },
        });
        if (activeCourse) {
            throw new ApiError(409, ERR.SCHOOL_DELETE_BLOCKED);
        }

        const activeEnrollment = await Enrollment.findOne({
            schoolId: id,
            status: { $in: enrollmentHelper.ACTIVE_STUDENT_STATUSES },
        });
        if (activeEnrollment) {
            throw new ApiError(409, ERR.SCHOOL_DELETE_BLOCKED);
        }

        school.status = 'deleted';
        school.registrationPaused = true;
        await school.save();
        return school;
    }

    async listUsers(query = {}) {
        const filter = {};
        if (query.status) filter.status = query.status;
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: 'i' } },
                { email: { $regex: query.search, $options: 'i' } },
            ];
        }
        const page = Number(query.page) || 1;
        const limit = Math.min(Number(query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(filter),
        ]);

        const userIds = users.map((u) => u._id);
        const roles = await UserRole.find({ userId: { $in: userIds }, status: 'active' }).lean();
        const rolesByUser = roles.reduce((acc, r) => {
            acc[r.userId] = acc[r.userId] || [];
            acc[r.userId].push(r);
            return acc;
        }, {});

        return {
            users: users.map((u) => ({ ...u, roles: rolesByUser[u._id] || [] })),
            total,
            page,
            limit,
        };
    }

    async assignRole({ userId, role, schoolId = null, licenseCategories = [] }, grantedBy) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);

        if ([ROLES.MANAGER, ROLES.COACH].includes(role) && !schoolId) {
            throw new ApiError(400, ERR.SCHOOL_CONTEXT_REQUIRED);
        }

        const roleDoc = await UserRole.findOneAndUpdate(
            { userId, role, schoolId: schoolId || null },
            {
                userId,
                role,
                schoolId: schoolId || null,
                licenseCategories: licenseCategories.map((c) => c.toUpperCase()),
                grantedBy,
                status: 'active',
            },
            { upsert: true, new: true, runValidators: true },
        );

        return roleDoc;
    }

    async createTrafficAccount({ name, email, phone, password }, grantedBy) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) throw new ApiError(409, ERR.EMAIL_EXISTS);

        const user = await User.create({
            name,
            email: normalizedEmail,
            phone,
            password: await passwordService.hashPassword(password),
            activeContext: { role: ROLES.TRAFFIC },
        });

        await this.assignRole({ userId: user._id, role: ROLES.TRAFFIC }, grantedBy);

        return {
            user: { _id: user._id, name: user.name, email: user.email, phone: user.phone },
        };
    }

    async suspendUser(userId, { status, reason = null }) {
        const user = await User.findByIdAndUpdate(userId, { status }, { new: true });
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);

        if (status === 'suspended') {
            await UserRole.updateMany({ userId }, { status: 'suspended' });
        }

        return { user: { _id: user._id, status: user.status }, reason };
    }

    async listAds(query = {}) {
        const now = new Date();
        const filter = {
            status: 'active',
            $or: [
                { startDate: null, endDate: null },
                { startDate: { $lte: now }, endDate: { $gte: now } },
                { startDate: { $lte: now }, endDate: null },
            ],
        };
        if (query.placement) filter.placement = query.placement;
        return Ad.find(filter)
            .sort({ order: 1, createdAt: -1 })
            .lean();
    }

    async createAd(adminId, data) {
        const payload = { ...data };
        if (payload.imageUrl) {
            payload.imageUrl = mediaService.normalizeImageRef(payload.imageUrl);
            await mediaService.assertMediaExists(payload.imageUrl);
        }
        return Ad.create({ ...payload, createdBy: adminId });
    }

    async updateAd(id, data) {
        const payload = { ...data };
        if (payload.imageUrl) {
            payload.imageUrl = mediaService.normalizeImageRef(payload.imageUrl);
            await mediaService.assertMediaExists(payload.imageUrl);
        }
        const ad = await Ad.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
        if (!ad) throw new ApiError(404, ERR.NOT_FOUND);
        return ad;
    }

    async distributeRosters({ rosterIds = [], trafficBatchId = null } = {}) {
        const filter = rosterIds.length
            ? { _id: { $in: rosterIds }, status: 'submitted' }
            : { status: 'submitted' };

        const rosters = await StudentRoster.find(filter);
        const results = [];
        for (const roster of rosters) {
            results.push(await rosterService.distribute(roster._id, { trafficBatchId }));
        }
        return { distributed: results.length, results };
    }

    async getReports(query = {}) {
        const [
            schoolsCount,
            activeSchools,
            usersCount,
            enrollmentsByStatus,
            paymentsTotal,
            recentEnrollments,
        ] = await Promise.all([
            DrivingSchool.countDocuments(),
            DrivingSchool.countDocuments({ status: 'active' }),
            User.countDocuments({ status: 'active' }),
            Enrollment.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Payment.aggregate([
                { $match: { status: 'completed' } },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$amount' },
                        platformShare: { $sum: '$platformShare' },
                        schoolShare: { $sum: '$schoolShare' },
                        count: { $sum: 1 },
                    },
                },
            ]),
            Enrollment.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            }),
        ]);

        return {
            period: query.period || '30d',
            schools: { total: schoolsCount, active: activeSchools },
            users: { active: usersCount },
            enrollments: {
                byStatus: enrollmentsByStatus.reduce((acc, row) => {
                    acc[row._id] = row.count;
                    return acc;
                }, {}),
                last30Days: recentEnrollments,
            },
            payments: paymentsTotal[0] || { totalAmount: 0, platformShare: 0, schoolShare: 0, count: 0 },
            commissionRate: config.platform.commission,
            completedEnrollments: await Enrollment.countDocuments({
                status: { $in: [ENROLLMENT_STATUS.COMPLETED, ENROLLMENT_STATUS.FINAL_PASSED] },
            }),
        };
    }
}

module.exports = new PlatformService();
