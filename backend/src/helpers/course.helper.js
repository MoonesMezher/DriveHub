const { COURSE_STATUS, COURSE_DURATION_DAYS } = require('../constants/courseStatus');
const { canLaunchCourse, addDays } = require('../utils/dateUtils');

const isRegistrationOpen = (course) =>
    course.registrationOpen && course.status === COURSE_STATUS.REGISTRATION_OPEN;

const isCourseFull = (course) => course.paidCount >= course.maxStudents;

const computeLaunchWindow = (course, closeDate = new Date()) => ({
    earliestLaunch: addDays(closeDate, course.launchAfterCloseDays || 7),
    trainingEnd: null,
});

const computeTrainingEnd = (launchDate) => addDays(launchDate, COURSE_DURATION_DAYS);

const canLaunchNewCourse = (previousLaunchDate) => canLaunchCourse(previousLaunchDate, 15);

module.exports = {
    isRegistrationOpen,
    isCourseFull,
    computeLaunchWindow,
    computeTrainingEnd,
    canLaunchNewCourse,
};
