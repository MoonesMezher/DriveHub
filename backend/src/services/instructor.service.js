const { Instructor, User, UserRole } = require('../models');
const { ROLES } = require('../constants/roles');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const passwordService = require('../utils/passwordService');

class InstructorService {
    async list(schoolId, query = {}) {
        const filter = { schoolId };
        if (query.status) filter.status = query.status;
        return Instructor.find(filter)
            .populate('userId', 'name email phone gender')
            .sort({ createdAt: -1 })
            .lean();
    }

    async getById(id, schoolId = null) {
        const filter = { _id: id };
        if (schoolId) filter.schoolId = schoolId;
        const instructor = await Instructor.findOne(filter)
            .populate('userId', 'name email phone gender')
            .lean();
        if (!instructor) throw new ApiError(404, ERR.INSTRUCTOR_NOT_FOUND);
        return instructor;
    }

    async assign({ userId, email, schoolId, licenseCategories, gender, isFemaleCoach, name, phone, password }) {
        if (!password) {
            throw new ApiError(400, 'يجب تعيين كلمة مرور للمدرب حتى يتمكن من تسجيل الدخول');
        }
        if (!name?.trim()) {
            throw new ApiError(400, 'يجب إدخال اسم المدرب');
        }

        let resolvedUserId = userId;
        if (email && !userId) {
            const normalizedEmail = email.trim().toLowerCase();
            let user = await User.findOne({ email: normalizedEmail });
            if (!user) {
                user = await User.create({
                    name: name.trim(),
                    email: normalizedEmail,
                    phone: phone?.trim() || undefined,
                    password: await passwordService.hashPassword(password),
                    activeContext: { role: ROLES.COACH, schoolId },
                });
            } else {
                user.name = name.trim();
                if (phone?.trim()) user.phone = phone.trim();
                user.password = await passwordService.hashPassword(password);
                await user.save();
            }
            resolvedUserId = user._id;
        }
        if (!resolvedUserId) throw new ApiError(400, ERR.VALIDATION_FAILED);

        const user = await User.findById(resolvedUserId);
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);

        if (userId) {
            user.name = name.trim();
            if (phone?.trim()) user.phone = phone.trim();
            user.password = await passwordService.hashPassword(password);
            await user.save();
        }

        const existing = await Instructor.findOne({ userId: resolvedUserId, schoolId });
        if (existing) throw new ApiError(409, ERR.INSTRUCTOR_EXISTS);

        const instructor = await Instructor.create({
            userId: resolvedUserId,
            schoolId,
            licenseCategories: licenseCategories.map((c) => c.toUpperCase()),
            gender,
            isFemaleCoach: isFemaleCoach ?? gender === 'female',
        });

        await UserRole.findOneAndUpdate(
            { userId: resolvedUserId, role: ROLES.COACH, schoolId },
            { userId: resolvedUserId, role: ROLES.COACH, schoolId, licenseCategories: instructor.licenseCategories, status: 'active' },
            { upsert: true, new: true },
        );

        return instructor;
    }

    async update(id, data, schoolId = null) {
        const filter = { _id: id };
        if (schoolId) filter.schoolId = schoolId;

        const instructor = await Instructor.findOneAndUpdate(filter, data, { new: true, runValidators: true });
        if (!instructor) throw new ApiError(404, ERR.INSTRUCTOR_NOT_FOUND);

        const rolePatch = {};
        if (data.licenseCategories) rolePatch.licenseCategories = instructor.licenseCategories;
        if (data.status) rolePatch.status = instructor.status;
        if (Object.keys(rolePatch).length) {
            await UserRole.updateOne(
                { userId: instructor.userId, role: ROLES.COACH, schoolId: instructor.schoolId },
                rolePatch,
            );
        }

        return Instructor.findById(instructor._id)
            .populate('userId', 'name email phone gender')
            .lean();
    }

    async remove(id, schoolId) {
        const instructor = await Instructor.findOneAndUpdate(
            { _id: id, schoolId },
            { status: 'suspended' },
            { new: true },
        );
        if (!instructor) throw new ApiError(404, ERR.INSTRUCTOR_NOT_FOUND);

        await UserRole.updateOne(
            { userId: instructor.userId, role: ROLES.COACH, schoolId },
            { status: 'suspended' },
        );

        return instructor;
    }
}

module.exports = new InstructorService();
