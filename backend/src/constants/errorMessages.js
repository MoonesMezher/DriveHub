/**
 * رسائل أخطاء API الموحّدة — عربية
 */
const ERR = {
    // عام
    UNAUTHORIZED: 'غير مصرّح — يرجى تسجيل الدخول',
    FORBIDDEN: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
    NOT_FOUND: 'المورد المطلوب غير موجود',
    VALIDATION_FAILED: 'بيانات غير صالحة',
    INTERNAL: 'حدث خطأ في الخادم — حاول لاحقاً',
    NOT_IMPLEMENTED: 'هذه الميزة قيد التطوير',
    INVALID_ID: 'المعرّف غير صالح',

    // Auth
    INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    EMAIL_EXISTS: 'البريد الإلكتروني مسجّل مسبقاً',
    ACCOUNT_SUSPENDED: 'الحساب موقوف — تواصل مع الدعم',
    INVALID_TOKEN: 'رمز الدخول غير صالح',
    INVALID_TOKEN_TYPE: 'نوع الرمز غير صالح',
    INVALID_REFRESH_TOKEN: 'رمز التحديث غير صالح',
    REFRESH_REVOKED: 'انتهت صلاحية الجلسة — سجّل الدخول مجدداً',
    RESET_CODE_INVALID: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
    RESET_CODE_ATTEMPTS_EXCEEDED: 'تم تجاوز عدد محاولات التحقق المسموح بها',
    RESET_TOKEN_INVALID: 'جلسة إعادة التعيين غير صالحة أو منتهية',
    PORTAL_DENIED: 'هذا الحساب لا يمكنه الدخول عبر البوابة المختارة',
    ROLE_NOT_ASSIGNED: 'لا تملك هذا الدور',
    USER_NOT_FOUND: 'المستخدم غير موجود',

    // RBAC
    INSUFFICIENT_ROLE: 'دورك الحالي لا يسمح بهذا الإجراء',
    INSUFFICIENT_PERMISSION: 'ليس لديك الصلاحيات الكافية',
    SCHOOL_CONTEXT_REQUIRED: 'يجب اختيار سياق المدرسة أولاً',
    ACTION_DENIED: 'لا يمكنك تنفيذ هذا الإجراء',

    // School
    SCHOOL_NOT_FOUND: 'المدرسة غير موجودة أو غير نشطة',
    SCHOOL_HAS_MANAGER: 'المدرسة لديها مدير بالفعل — أكّد الاستبدال للمتابعة',
    SCHOOL_DELETE_BLOCKED: 'لا يمكن حذف المدرسة — توجد دورات أو اشتراكات نشطة',
    SCHOOL_APPLICATION_NOT_FOUND: 'طلب المدرسة غير موجود',

    // License
    LICENSE_NOT_FOUND: 'فئة الرخصة غير موجودة',
    LICENSE_PARENT_NOT_FOUND: 'فئة الرخصة الأم غير موجودة',

    // Course
    COURSE_NOT_FOUND: 'الدورة غير موجودة',
    COURSE_LAUNCH_TOO_EARLY: 'لا يمكن إطلاق دورة جديدة قبل مرور 15 يوماً على إطلاق آخر دورة',
    COURSE_LAUNCH_BEFORE_WINDOW: 'لا يمكن إطلاق الدورة قبل انقضاء فترة الانتظار بعد إغلاق التسجيل',

    // Enrollment
    ENROLLMENT_NOT_FOUND: 'طلب الاشتراك غير موجود',
    ENROLLMENT_PENDING_EXISTS: 'لديك طلب اشتراك معلّق بالفعل',
    ENROLLMENT_NO_SPOTS: 'لا توجد أماكن متاحة في هذه الدورة',
    ENROLLMENT_UNDERAGE: 'عمرك لا يستوفي الحد الأدنى المطلوب لهذه الفئة',
    ENROLLMENT_DOB_REQUIRED: 'أكمل تاريخ الميلاد في ملفك الشخصي قبل التقديم',
    ENROLLMENT_DOCUMENTS_REQUIRED: 'يجب رفع صورة الهوية والتوثيق الطبي قبل تقديم الطلب',
    ENROLLMENT_NATIONAL_ID_REQUIRED: 'يجب رفع صورة الهوية الوطنية قبل التقديم',
    ENROLLMENT_MEDICAL_REPORT_REQUIRED: 'يجب رفع التوثيق الطبي قبل التقديم',
    ENROLLMENT_NOT_CANCELLABLE: 'لا يمكن إلغاء هذا الطلب في حالته الحالية',
    ENROLLMENT_NOT_OWNER: 'هذا الطلب لا يخصك',
    ENROLLMENT_PREREQUISITE_MISSING: 'لم تستوفِ متطلبات الفئة المطلوبة بعد',
    ENROLLMENT_CATEGORY_MISMATCH: 'فئة الرخصة لا تطابق الدورة المختارة',
    ENROLLMENT_SUBTYPE_REQUIRED: 'يجب اختيار B1 أو B2 لفئة الخصوصي',
    ENROLLMENT_SUBTYPE_LOCKED: 'لا يمكن تغيير النوع الفرعي بعد التسجيل',
    ENROLLMENT_ACTIVE_CATEGORY_EXISTS: 'لديك اشتراك نشط لهذه الفئة بالفعل',
    ENROLLMENT_MULTI_CATEGORY: 'طلب واحد لفئة واحدة فقط — لا يمكن دمج الفئات',
    ENROLLMENT_NOT_RETAKEABLE: 'لا يمكن إعادة الاشتراك في حالة هذا الطلب',
    ENROLLMENT_ALREADY_ARCHIVED: 'تم أرشفة هذا الاشتراك مسبقاً',
    ENROLLMENT_RETAKE_SCOPE_MISMATCH: 'نطاق الإعادة لا يطابق حالة الرسوب',
    ENROLLMENT_RETAKE_COURSE_UNAVAILABLE: 'لا توجد دورة مفتوحة لإعادة الاشتراك حالياً',
    LESSON_NO_COACHES: 'لا يوجد مدربون مؤهلون لحجز درس',
    LESSON_NO_SLOTS: 'لا توجد مواعيد متاحة للحجز التلقائي',
    LESSON_ACTIVE_EXISTS: 'لديك موعد نشط بالفعل — ألغِ الموعد الحالي قبل حجز موعد جديد',
    LESSON_NOT_CANCELLABLE: 'لا يمكن إلغاء هذا الموعد في حالته الحالية',
    LESSON_NOT_POSTPONABLE: 'لا يمكن تأجيل هذا الموعد في حالته الحالية',
    LESSON_NOT_CONFIRMABLE: 'لا يمكن تأكيد هذا الموعد في حالته الحالية',
    LESSON_INVALID_RANGE: 'يجب اختيار يوم أو أسبوع صالح',
    LESSON_RANGE_IN_PAST: 'الفترة المحددة في الماضي — اختر يوماً أو أسبوعاً قادماً',
    LESSON_INVALID_SCHEDULE: 'موعد التأجيل غير صالح — اختر وقتاً في المستقبل',
    LESSON_FUTURE_COMPLETE: 'لا يمكن تقييم أو إكمال درس موعده في المستقبل',

    // Payment
    PAYMENT_AMOUNT_MISMATCH: 'مبلغ الدفع لا يطابق المطلوب',
    PAYMENT_NOT_FOUND: 'عملية الدفع غير موجودة',
    PAYMENT_ALREADY_COMPLETED: 'تم الدفع مسبقاً',
    PAYMENT_DEADLINE_EXPIRED: 'انتهت مهلة الدفع',
    PRICING_NOT_FOUND: 'لم يُحدد سعر لهذه الفئة',

    // Wallet
    WALLET_CREDIT_INVALID: 'مبلغ الرصيد يجب أن يكون أكبر من صفر',
    WALLET_INSUFFICIENT_BALANCE: (balance) => `رصيدك غير كافٍ — رصيدك الحالي ${balance} د.أ`,

    // Document
    DOCUMENT_NOT_FOUND: 'المستند غير موجود',
    NO_FILE: 'لم يتم إرفاق ملف',
    INVALID_FILE_TYPE: 'نوع الملف غير مسموح — يُقبل JPEG أو PNG أو PDF فقط',
    FILE_SIGNATURE_MISMATCH: 'محتوى الملف لا يطابق نوعه — قد يكون الملف تالفاً أو غير آمن',
    FILE_TOO_LARGE: 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)',
    INVALID_IMAGE_TYPE: 'نوع الصورة غير مسموح — يُقبل JPEG أو PNG أو WebP فقط',
    EXTERNAL_IMAGE_URL_REJECTED: 'يجب رفع ملف صورة وليس إدخال رابط خارجي',
    INVALID_MEDIA_REF: 'مرجع الصورة غير صالح — ارفع ملف صورة أولاً',
    IMAGE_UPLOAD_REQUIRED: 'يجب رفع ملف صورة',
    MEDIA_NOT_FOUND: 'الصورة غير موجودة',
    PASSWORD_WEAK: 'كلمة المرور ضعيفة: 8 أحرف على الأقل، حرف كبير وصغير، رقم، ورمز خاص',

    // Notification
    NOTIFICATION_NOT_FOUND: 'الإشعار غير موجود',

    // Student / content / exam
    ACTIVE_ENROLLMENT_REQUIRED: 'لا يوجد اشتراك نشط — أكمل التسجيل والدفع أولاً',
    CONTENT_NOT_FOUND: 'المحتوى التعليمي غير موجود',
    CONTENT_LOCKED: 'هذا المحتوى مقفل — أكمل المرحلة السابقة أولاً',
    CONTENT_UNLOCK_STAFF_ONLY: 'لا يمكن تغيير وضع فتح المحتوى بدون اشتراك نشط',
    CONTENT_UNLOCK_CATEGORY_MISMATCH: 'فئة الرخصة لا تطابق اشتراكك النشط',
    QUESTION_BANK_NOT_FOUND: 'بنك الأسئلة غير موجود',
    QUESTION_NOT_FOUND: 'السؤال غير موجود',
    NO_QUESTIONS_AVAILABLE: 'لا توجد أسئلة متاحة لهذه الفئة',
    PRACTICE_ALREADY_PASSED: 'لقد نجحت في الاختبار التجريبي — لا يمكن إعادة المحاولة',
    PRACTICE_SESSION_REQUIRED: 'يجب بدء جلسة اختبار قبل الإرسال',
    PRACTICE_SESSION_NOT_FOUND: 'جلسة الاختبار غير موجودة أو منتهية',
    PRACTICE_SESSION_EXPIRED: 'انتهت مدة الاختبار — تم إغلاق الجلسة',
    ROSTER_VERIFY_NOT_FOUND: 'رمز التحقق غير صالح أو منتهي',
    EDIT_REQUEST_NOT_FOUND: 'طلب التعديل غير موجود',
    EDIT_ALREADY_REVIEWED: 'تمت مراجعة هذا الطلب مسبقاً',

    // Instructor / lesson
    INSTRUCTOR_NOT_FOUND: 'المدرب غير موجود',
    INSTRUCTOR_EXISTS: 'هذا المستخدم مُعيَّن كمدرب في المدرسة مسبقاً',
    LESSON_NOT_FOUND: 'الدرس غير موجود',
    LESSON_CONFLICT: 'يوجد تعارض في الموعد مع درس آخر',

    COACH_NOT_IN_SCHOOL: 'المدرب لا ينتمي لهذه المدرسة',
    COACH_STUDENT_NOT_ASSIGNED: 'لا يمكنك كتابة ملاحظات أو تقييم لطالب غير مسجّل لديك',

    // Roster
    ROSTER_NOT_FOUND: 'قائمة الطلاب غير موجودة',
    ROSTER_EXISTS: 'قائمة طلاب موجودة لهذه الدورة مسبقاً',
    ROSTER_NOT_SUBMITTED: 'القائمة لم تُرسَل بعد',
    ROSTER_ALREADY_SUBMITTED: 'تم إرسال القائمة مسبقاً',
    ROSTER_COURSE_NOT_LAUNCHED: 'لا يمكن رفع قائمة الطلاب قبل إطلاق الدورة',
    ROSTER_TOO_EARLY: 'لا يمكن رفع قائمة الطلاب قبل مرور 15 يوماً من إطلاق الدورة',

    // Review
    REVIEW_EXISTS: 'لديك تقييم لهذه المدرسة مسبقاً',
    REVIEW_NOT_FOUND: 'التقييم غير موجود',

    // Pre-registration / application
    PRE_REGISTRATION_NOT_FOUND: 'التسجيل المسبق غير موجود',
    PRE_REGISTRATION_EXISTS: 'لديك حجز مسبق نشط لهذه المدرسة',
    PRE_REGISTRATION_DISABLED: 'التسجيل المسبق غير مفعّل في هذه المدرسة',
    APPLICATION_NOT_FOUND: 'طلب المدرسة غير موجود',
    APPLICATION_ALREADY_REVIEWED: 'تمت مراجعة هذا الطلب مسبقاً',
    APPLICATION_PENDING_EXISTS: 'لديك طلب مدرسة قيد المراجعة',
    PLATFORM_REGISTRATION_PAUSED: 'التسجيل موقوف مؤقتاً على مستوى المنصة',

    // Traffic
    SCHEDULE_NOT_FOUND: 'موعد الامتحان غير موجود',
    SCHEDULE_CONFLICT: 'يوجد موعد امتحان آخر في نفس الوقت',
    LICENSE_RECORD_EXISTS: 'سجل الرخصة موجود مسبقاً لهذا المستخدم',

    // Mongoose
    DUPLICATE_VALUE: (field) => `القيمة مكررة للحقل: ${field}`,
    INVALID_FIELD: (field) => `قيمة غير صالحة للحقل: ${field}`,
};

module.exports = { ERR };
