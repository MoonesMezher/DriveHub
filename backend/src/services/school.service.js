const { DrivingSchool } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { sortSchoolsByDistance } = require('../helpers/school.helper');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');

class SchoolService {
    async findForMap({ lat, lng, category, femaleCoach } = {}) {
        const filter = { status: 'active', registrationPaused: { $ne: true } };
        if (category) filter.licenses = category.toUpperCase();
        if (femaleCoach === 'true') filter.hasFemaleCoaches = true;

        const schools = await DrivingSchool.find(filter)
            .select('name address governorate lat lng licenses hasFemaleCoaches')
            .lean();

        if (lat != null && lng != null) {
            return sortSchoolsByDistance(schools, Number(lat), Number(lng));
        }
        return schools;
    }

    async findNearby({ lat, lng, category, femaleCoach, query = {} }) {
        const { page, limit, skip } = parsePagination(query);
        const filter = { status: 'active', registrationPaused: { $ne: true } };
        if (category) filter.licenses = category.toUpperCase();
        if (femaleCoach === 'true') filter.hasFemaleCoaches = true;

        const schools = await DrivingSchool.find(filter).lean();
        const sorted = sortSchoolsByDistance(schools, Number(lat), Number(lng));
        const total = sorted.length;
        const items = sorted.slice(skip, skip + limit);

        return {
            items,
            pagination: buildPaginationMeta({ page, limit, total }),
        };
    }

    async getById(id) {
        const school = await DrivingSchool.findById(id).lean();
        if (!school || school.status !== 'active') {
            throw new ApiError(404, ERR.SCHOOL_NOT_FOUND);
        }
        return school;
    }

    async getOpenCourses(schoolId, categoryCode) {
        const courseService = require('./course.service');
        return courseService.getOpenCourses(schoolId, categoryCode);
    }

    async getCoaches(schoolId) {
        const instructorService = require('./instructor.service');
        const coaches = await instructorService.list(schoolId, { status: 'active' });
        return coaches.map((coach) => ({
            _id: coach._id,
            userId: coach.userId?._id || coach.userId,
            name: coach.userId?.name || 'مدرب',
            gender: coach.gender,
            isFemaleCoach: coach.isFemaleCoach,
            licenseCategories: coach.licenseCategories,
        }));
    }
}

module.exports = new SchoolService();
