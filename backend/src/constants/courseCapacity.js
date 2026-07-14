/** Max students per course = school vehicles × this multiplier (plan §7). */
const STUDENTS_PER_VEHICLE = Number(process.env.STUDENTS_PER_VEHICLE) || 5;

const computeMaxStudents = (vehiclesCount) => {
    const count = Number(vehiclesCount) || 0;
    if (count <= 0) return null;
    return count * STUDENTS_PER_VEHICLE;
};

module.exports = { STUDENTS_PER_VEHICLE, computeMaxStudents };
