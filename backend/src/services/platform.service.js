const {
    PlatformPricing,
    PlatformSetting,
    DrivingSchool,
    User,
    UserRole,
    Ad,
    Enrollment,
    Payment,
    StudentRoster,
    WalletTransaction,
} = require('../models');
const { ROLES } = require('../constants/roles');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const config = require('../config');
const passwordService = require('../utils/passwordService');
const rosterService = require('./roster.service');
const mediaService = require('./media.service');

const COMMISSION_KEY = 'platform_commission';

const schoolNameFromRef = (schoolRef) => {
    if (!schoolRef) return null;
    if (typeof schoolRef === 'object') return schoolRef.name || null;
    return null;
};

const schoolIdFromRef = (schoolRef) => {
    if (!schoolRef) return null;
    if (typeof schoolRef === 'string') return schoolRef;
    return schoolRef._id || schoolRef.id || null;
};

const collectMissingSchoolIds = (users) => {
    const ids = [];
    for (const user of users) {
        for (const role of user.roles || []) {
            if (role.schoolName || schoolNameFromRef(role.schoolId)) continue;
            const id = schoolIdFromRef(role.schoolId);
            if (id) ids.push(String(id));
        }
        const ctx = user.activeContext;
        if (ctx?.schoolId && !ctx.schoolName && !schoolNameFromRef(ctx.schoolId)) {
            const id = schoolIdFromRef(ctx.schoolId);
            if (id) ids.push(String(id));
        }
    }
    return [...new Set(ids)];
};

/** Ensure roles/activeContext expose schoolName (populate + fallback lookup). */
const withSchoolNames = async (usersInput) => {
    const list = Array.isArray(usersInput) ? usersInput : [usersInput];
    const missingIds = collectMissingSchoolIds(list.filter(Boolean));
    let nameById = {};
    if (missingIds.length) {
        const schools = await DrivingSchool.find({ _id: { $in: missingIds } })
            .select('name')
            .lean();
        nameById = Object.fromEntries(schools.map((s) => [String(s._id), s.name]));
    }

    const resolveName = (schoolRef, existing) => {
        if (existing) return existing;
        const fromRef = schoolNameFromRef(schoolRef);
        if (fromRef) return fromRef;
        const id = schoolIdFromRef(schoolRef);
        return id ? nameById[String(id)] || null : null;
    };

    const mapUser = (user) => {
        if (!user) return user;
        const roles = (user.roles || []).map((role) => ({
            ...role,
            schoolName: resolveName(role.schoolId, role.schoolName),
        }));
        const activeContext = user.activeContext
            ? {
                ...user.activeContext,
                schoolName: resolveName(
                    user.activeContext.schoolId,
                    user.activeContext.schoolName,
                ),
            }
            : user.activeContext;
        return { ...user, roles, activeContext };
    };

    return Array.isArray(usersInput) ? list.map(mapUser) : mapUser(usersInput);
};

class PlatformService {
    async loadCommissionFromStore() {
        const doc = await PlatformSetting.findOne({ key: COMMISSION_KEY }).lean();
        if (doc?.value == null) return config.platform.commission;
        const value = Number(doc.value);
        if (!Number.isFinite(value)) return config.platform.commission;
        config.platform.commission = value;
        return value;
    }

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
        await PlatformSetting.findOneAndUpdate(
            { key: COMMISSION_KEY },
            { key: COMMISSION_KEY, value: String(commission) },
            { upsert: true, new: true, runValidators: true },
        );
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

    async getSchoolById(id) {
        const school = await DrivingSchool.findById(id)
            .select('+bankAccount')
            .populate('managerId', 'name email phone status')
            .lean();
        if (!school) throw new ApiError(404, ERR.SCHOOL_NOT_FOUND);
        return school;
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
            User.find(filter)
                .select('-password')
                .populate('activeContext.schoolId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        const userIds = users.map((u) => u._id);
        const roles = await UserRole.find({ userId: { $in: userIds }, status: 'active' })
            .populate('schoolId', 'name')
            .lean();
        const rolesByUser = roles.reduce((acc, r) => {
            const key = String(r.userId);
            acc[key] = acc[key] || [];
            acc[key].push(r);
            return acc;
        }, {});

        const usersWithRoles = await withSchoolNames(
            users.map((u) => ({
                ...u,
                roles: rolesByUser[String(u._id)] || [],
            })),
        );

        return {
            users: usersWithRoles,
            total,
            page,
            limit,
        };
    }

    async getUserById(id) {
        const user = await User.findById(id)
            .select('-password')
            .populate('activeContext.schoolId', 'name governorate status')
            .lean();
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);

        const roles = await UserRole.find({ userId: id })
            .populate('schoolId', 'name governorate status')
            .populate('grantedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return withSchoolNames({ ...user, roles });
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

    async assignSchoolManager(schoolId, data, grantedBy) {
        const { userId, name, email, phone, password, replace = false } = data;

        const school = await DrivingSchool.findById(schoolId);
        if (!school || school.status === 'deleted') {
            throw new ApiError(404, ERR.SCHOOL_NOT_FOUND);
        }

        if (school.managerId && !replace) {
            throw new ApiError(409, ERR.SCHOOL_HAS_MANAGER);
        }

        let managerUser;
        let created = false;

        if (userId) {
            managerUser = await User.findById(userId);
            if (!managerUser) throw new ApiError(404, ERR.USER_NOT_FOUND);
        } else {
            const normalizedEmail = email.trim().toLowerCase();
            const existing = await User.findOne({ email: normalizedEmail });
            if (existing) throw new ApiError(409, ERR.EMAIL_EXISTS);

            managerUser = await User.create({
                name,
                email: normalizedEmail,
                phone,
                password: await passwordService.hashPassword(password),
                activeContext: { role: ROLES.MANAGER, schoolId },
            });
            created = true;
        }

        const previousManagerId = school.managerId
            ? String(school.managerId)
            : null;

        if (previousManagerId && previousManagerId !== String(managerUser._id)) {
            await UserRole.updateOne(
                { userId: school.managerId, role: ROLES.MANAGER, schoolId },
                { status: 'suspended' },
            );
        }

        await this.assignRole(
            { userId: managerUser._id, role: ROLES.MANAGER, schoolId },
            grantedBy,
        );

        school.managerId = managerUser._id;
        await school.save();

        managerUser.activeContext = { role: ROLES.MANAGER, schoolId };
        await managerUser.save();

        const schoolDetail = await this.getSchoolById(schoolId);

        return {
            school: schoolDetail,
            manager: {
                _id: managerUser._id,
                name: managerUser.name,
                email: managerUser.email,
                phone: managerUser.phone,
            },
            created,
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
            walletCreditsTotal,
            recentEnrollments,
            commissionRate,
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
            WalletTransaction.aggregate([
                { $match: { type: 'admin_credit' } },
                {
                    $group: {
                        _id: null,
                        totalCredited: { $sum: '$amount' },
                        creditCount: { $sum: 1 },
                    },
                },
            ]),
            Enrollment.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            }),
            this.loadCommissionFromStore(),
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
            wallet: walletCreditsTotal[0] || { totalCredited: 0, creditCount: 0 },
            commissionRate,
            completedEnrollments: await Enrollment.countDocuments({
                status: { $in: [ENROLLMENT_STATUS.COMPLETED, ENROLLMENT_STATUS.FINAL_PASSED] },
            }),
        };
    }
}

module.exports = new PlatformService();
