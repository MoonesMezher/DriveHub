module.exports = {
    // Auth & users
    User: require('./User'),
    UserRole: require('./UserRole'),
    RefreshToken: require('./RefreshToken'),
    PasswordResetToken: require('./PasswordResetToken'),
    UserLocation: require('./UserLocation'),
    DocumentUpload: require('./DocumentUpload'),
    DocumentAccessLog: require('./DocumentAccessLog'),
    MediaAsset: require('./MediaAsset'),

    // Schools & applications
    DrivingSchool: require('./DrivingSchool'),
    SchoolApplication: require('./SchoolApplication'),
    Instructor: require('./Instructor'),
    Review: require('./Review'),

    // Licenses & pricing
    LicenseCategory: require('./LicenseCategory'),
    LicenseSubType: require('./LicenseSubType'),
    PlatformPricing: require('./PlatformPricing'),

    // Courses & enrollment
    TrainingCourse: require('./TrainingCourse'),
    Enrollment: require('./Enrollment'),
    EnrollmentArchive: require('./EnrollmentArchive'),
    WaitingList: require('./WaitingList'),
    PreRegistration: require('./PreRegistration'),
    Payment: require('./Payment'),
    WalletTransaction: require('./WalletTransaction'),

    // Learning content
    QuestionBank: require('./QuestionBank'),
    QuestionEditRequest: require('./QuestionEditRequest'),
    TrainingDataEdit: require('./TrainingDataEdit'),
    TheoryContent: require('./TheoryContent'),
    TrainingContentShared: require('./TrainingContentShared'),
    TrainingContentSpecific: require('./TrainingContentSpecific'),
    PracticalVideo: require('./PracticalVideo'),
    ContentUnlockMode: require('./ContentUnlockMode'),
    PracticeExam: require('./PracticeExam'),
    PracticeExamSession: require('./PracticeExamSession'),

    // Lessons & coaching
    PracticalLesson: require('./PracticalLesson'),
    CoachNote: require('./CoachNote'),
    StudentStatistics: require('./StudentStatistics'),

    // Exams & traffic
    FinalExamResult: require('./FinalExamResult'),
    StudentRoster: require('./StudentRoster'),
    TrafficExamSchedule: require('./TrafficExamSchedule'),
    TrafficExamResult: require('./TrafficExamResult'),
    DrivingLicenseRecord: require('./DrivingLicenseRecord'),

    // Platform
    Notification: require('./Notification'),
    AuditLog: require('./AuditLog'),
    Ad: require('./Ad'),
    PlatformSetting: require('./PlatformSetting'),
    FaqItem: require('./FaqItem'),
    RequirementItem: require('./RequirementItem'),
    Testimonial: require('./Testimonial'),
};
