import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const managerService = {
  listCourses: (params) => apiClient.get(`${ENDPOINTS.manager.courses}${buildQueryString(params)}`),
  createCourse: (data) => apiClient.post(ENDPOINTS.manager.courses, data),
  closeCourse: (id) => apiClient.patch(ENDPOINTS.manager.closeCourse(id)),
  launchCourse: (id, previousLaunchDate) =>
    apiClient.post(ENDPOINTS.manager.launchCourse(id), { previousLaunchDate }),
  enrollmentQueue: (courseId) => apiClient.get(ENDPOINTS.manager.enrollmentQueue(courseId)),
  rosterCandidates: (courseId) => apiClient.get(ENDPOINTS.manager.rosterCandidates(courseId)),
  acceptEnrollment: (id, paymentDeadlineDays = 3) =>
    apiClient.post(ENDPOINTS.manager.acceptEnrollment(id), { status: 'accepted', paymentDeadlineDays }),
  rejectEnrollment: (id, rejectionReason) =>
    apiClient.post(ENDPOINTS.manager.rejectEnrollment(id), { status: 'rejected', rejectionReason }),
  awaitingPaymentQueue: (courseId) => apiClient.get(ENDPOINTS.manager.awaitingPaymentQueue(courseId)),
  confirmEnrollmentPayment: (id, amount, gatewayRef) =>
    apiClient.post(ENDPOINTS.manager.confirmEnrollmentPayment(id), { amount, gatewayRef }),
  listInstructors: () => apiClient.get(ENDPOINTS.manager.instructors),
  assignInstructor: (data) => apiClient.post(ENDPOINTS.manager.assignInstructor, data),
  updateInstructor: (id, data) => apiClient.patch(ENDPOINTS.manager.updateInstructor(id), data),
  listQuestionBanks: (params) => apiClient.get(`${ENDPOINTS.manager.questionBanks}${buildQueryString(params)}`),
  createQuestionBank: (data) => apiClient.post(ENDPOINTS.manager.questionBanks, data),
  addQuestion: (bankId, data) => apiClient.post(ENDPOINTS.manager.addQuestion(bankId), data),
  listTheoryContent: (params) => apiClient.get(`${ENDPOINTS.manager.theoryContent}${buildQueryString(params)}`),
  createTheoryContent: (data) => apiClient.post(ENDPOINTS.manager.theoryContent, data),
  pendingEdits: () => apiClient.get(ENDPOINTS.manager.pendingEdits),
  reviewEdit: (id, data) => apiClient.post(ENDPOINTS.manager.reviewEdit(id), data),
  createRoster: (data) => apiClient.post(ENDPOINTS.manager.rosters, data),
  listRosters: (params) => apiClient.get(`${ENDPOINTS.manager.rosters}${buildQueryString(params)}`),
  submitRoster: (id) => apiClient.post(ENDPOINTS.manager.submitRoster(id)),
  getSchedule: (params) => apiClient.get(`${ENDPOINTS.manager.schedule}${buildQueryString(params)}`),
  enrollmentDocuments: (enrollmentId) =>
    apiClient.get(`${ENDPOINTS.documents}/enrollment/${enrollmentId}`),
}
