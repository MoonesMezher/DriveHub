const { PreRegistration, DrivingSchool } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

class PreRegistrationService {
    async create(userId, { schoolId, categoryCode, subTypeCode = null }) {
        const school = await DrivingSchool.findById(schoolId);
        if (!school || school.status !== 'active') {
            throw new ApiError(404, ERR.SCHOOL_NOT_FOUND);
        }
        if (!school.preRegistrationEnabled) {
            throw new ApiError(400, ERR.PRE_REGISTRATION_DISABLED);
        }

        const existing = await PreRegistration.findOne({
            userId,
            schoolId,
            categoryCode: categoryCode.toUpperCase(),
            status: 'reserved',
        });
        if (existing) throw new ApiError(409, ERR.PRE_REGISTRATION_EXISTS);

        return PreRegistration.create({
            userId,
            schoolId,
            categoryCode: categoryCode.toUpperCase(),
            subTypeCode: subTypeCode?.toUpperCase() || null,
            status: 'reserved',
        });
    }

    async listMine(userId) {
        return PreRegistration.find({ userId })
            .sort({ createdAt: -1 })
            .populate('schoolId', 'name address governorate')
            .lean();
    }

    async cancel(id, userId) {
        const preReg = await PreRegistration.findOne({ _id: id, userId, status: 'reserved' });
        if (!preReg) throw new ApiError(404, ERR.PRE_REGISTRATION_NOT_FOUND);

        preReg.status = 'cancelled';
        await preReg.save();
        return preReg;
    }
}

module.exports = new PreRegistrationService();
