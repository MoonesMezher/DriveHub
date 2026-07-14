/** Matches backend `courseCapacity.js` — maxStudents = vehicles × multiplier */
export const STUDENTS_PER_VEHICLE = 5

export const computeMaxStudentsFromVehicles = (vehiclesCount) => {
  const count = Number(vehiclesCount) || 0
  if (count <= 0) return null
  return count * STUDENTS_PER_VEHICLE
}
