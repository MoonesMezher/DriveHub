const dayjs = require('dayjs');

const addDays = (date, days) => dayjs(date).add(days, 'day').toDate();

const diffDays = (from, to = new Date()) => dayjs(to).diff(dayjs(from), 'day');

const isBefore = (date, compareTo = new Date()) => dayjs(date).isBefore(dayjs(compareTo));

const isAfter = (date, compareTo = new Date()) => dayjs(date).isAfter(dayjs(compareTo));

const canLaunchCourse = (previousLaunchDate, minDays = 15) => {
    if (!previousLaunchDate) return true;
    return diffDays(previousLaunchDate) >= minDays;
};

const paymentDeadlineFromNow = (days = 3) => addDays(new Date(), days);

module.exports = {
    addDays,
    diffDays,
    isBefore,
    isAfter,
    canLaunchCourse,
    paymentDeadlineFromNow,
};
