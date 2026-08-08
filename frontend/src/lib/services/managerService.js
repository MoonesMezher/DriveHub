import { apiClient, ENDPOINTS } from '@/lib/api'
import { buildQueryString } from '@/lib/helpers/pagination'

export const managerService = {
  listCourses: (params) => apiClient.get(`${ENDPOINTS.manager.courses}${buildQueryString(params)}`),
  getCourse: (id) => apiClient.get(ENDPOINTS.manager.course(id)),
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
  getInstructor: (id) => apiClient.get(ENDPOINTS.manager.instructor(id)),
  assignInstructor: (data) => apiClient.post(ENDPOINTS.manager.assignInstructor, data),
  updateInstructor: (id, data) => apiClient.patch(ENDPOINTS.manager.updateInstructor(id), data),
  listQuestionBanks: (params) => apiClient.get(`${ENDPOINTS.manager.questionBanks}${buildQueryString(params)}`),
  getQuestionBank: (bankId) => apiClient.get(ENDPOINTS.manager.questionBank(bankId)),
  createQuestionBank: (data) => apiClient.post(ENDPOINTS.manager.questionBanks, data),
  addQuestion: (bankId, data) => apiClient.post(ENDPOINTS.manager.addQuestion(bankId), data),
  getQuestion: (bankId, questionId) => apiClient.get(ENDPOINTS.manager.question(bankId, questionId)),
  updateQuestion: (bankId, questionId, data) =>
    apiClient.patch(ENDPOINTS.manager.updateQuestion(bankId, questionId), data),
  listTheoryContent: (params) => apiClient.get(`${ENDPOINTS.manager.theoryContent}${buildQueryString(params)}`),
  getTheoryContent: (id) => apiClient.get(ENDPOINTS.manager.theoryContentItem(id)),
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
