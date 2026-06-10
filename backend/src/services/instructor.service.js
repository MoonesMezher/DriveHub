const { Instructor, User, UserRole } = require('../models');
const { ROLES } = require('../constants/roles');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

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
            .populate('userId', 'name email phone')
            .lean();
        if (!instructor) throw new ApiError(404, ERR.INSTRUCTOR_NOT_FOUND);
        return instructor;
    }

    async assign({ userId, schoolId, licenseCategories, gender, isFemaleCoach }) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, ERR.USER_NOT_FOUND);

        const existing = await Instructor.findOne({ userId, schoolId });
        if (existing) throw new ApiError(409, ERR.INSTRUCTOR_EXISTS);

        const instructor = await Instructor.create({
            userId,
            schoolId,
            licenseCategories: licenseCategories.map((c) => c.toUpperCase()),
            gender,
            isFemaleCoach: isFemaleCoach ?? gender === 'female',
        });

        await UserRole.findOneAndUpdate(
            { userId, role: ROLES.COACH, schoolId },
            { userId, role: ROLES.COACH, schoolId, licenseCategories: instructor.licenseCategories, status: 'active' },
            { upsert: true, new: true },
        );

        return instructor;
    }

    async update(id, data, schoolId = null) {
        const filter = { _id: id };
        if (schoolId) filter.schoolId = schoolId;

        const instructor = await Instructor.findOneAndUpdate(filter, data, { new: true, runValidators: true });
        if (!instructor) throw new ApiError(404, ERR.INSTRUCTOR_NOT_FOUND);

        if (data.licenseCategories) {
            await UserRole.updateOne(
                { userId: instructor.userId, role: ROLES.COACH, schoolId: instructor.schoolId },
                { licenseCategories: instructor.licenseCategories },
            );
        }

        return instructor;
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
