const { DrivingSchool, TrainingCourse } = require('../models');
const { COURSE_STATUS } = require('../constants/courseStatus');
const { sortSchoolsByDistance } = require('./school.helper');

const MAX_SUGGESTIONS = 5;

async function buildAlternateSchoolSuggestions({
    categoryCode,
    subTypeCode = null,
    governorate = null,
    excludeSchoolId = null,
    lat = null,
    lng = null,
    limit = MAX_SUGGESTIONS,
} = {}) {
    const code = categoryCode?.toUpperCase();
    if (!code) return [];

    const schoolFilter = {
        status: 'active',
        registrationPaused: { $ne: true },
        licenses: code,
    };
    if (governorate) schoolFilter.governorate = governorate;
    if (excludeSchoolId) schoolFilter._id = { $ne: excludeSchoolId };

    let schools = await DrivingSchool.find(schoolFilter)
        .select('name governorate lat lng')
        .lean();

    if (lat != null && lng != null) {
        schools = sortSchoolsByDistance(schools, Number(lat), Number(lng));
    }

    const suggestions = [];

    for (const school of schools) {
        if (suggestions.length >= limit) break;

        const courseFilter = {
            schoolId: school._id,
            categoryCode: code,
            registrationOpen: true,
            status: COURSE_STATUS.REGISTRATION_OPEN,
        };
        if (subTypeCode) courseFilter.subTypeCode = subTypeCode.toUpperCase();

        const openCourse = await TrainingCourse.findOne(courseFilter).lean();
        if (openCourse) {
            const sub = openCourse.subTypeCode ? ` (${openCourse.subTypeCode})` : '';
            suggestions.push(`${school.name} — دورة ${code}${sub} مفتوحة`);
            continue;
        }

        const upcoming = await TrainingCourse.findOne({
            schoolId: school._id,
            categoryCode: code,
            status: { $in: [COURSE_STATUS.REGISTRATION_CLOSED, COURSE_STATUS.REGISTRATION_OPEN] },
        })
            .sort({ createdAt: -1 })
            .lean();

        if (upcoming) {
            suggestions.push(`${school.name} — تسجيل ${upcoming.registrationOpen ? 'مفتوح' : 'مغلق'} لفئة ${code}`);
        }
    }

    return suggestions.slice(0, limit);
}

module.exports = { buildAlternateSchoolSuggestions, MAX_SUGGESTIONS };
