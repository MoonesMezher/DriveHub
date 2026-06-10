const { runValidation } = require('../../../src/validators/runValidation');
const {
    registerRules,
    loginRules,
    createEnrollmentRules,
    createCourseRules,
    nearbySchoolsQuery,
    schoolApplicationRules,
    createSchoolRules,
    upsertCategoryRules,
    confirmPaymentRules,
    uploadDocumentRules,
    sendNotificationRules,
    createQuestionRules,
    trafficScheduleRules,
    createReviewRules,
    upsertPricingRules,
} = require('../../../src/validators');

const strongPassword = 'SecurePass1!';

describe('Validators', () => {
    describe('auth', () => {
        it('rejects register without name in Arabic', async () => {
            const result = await runValidation(registerRules, {
                email: 'test@drivehub.local',
                password: strongPassword,
            });
            expect(result.isEmpty()).toBe(false);
            expect(result.array()[0].msg).toMatch(/الاسم مطلوب/);
        });

        it('rejects weak password with clear Arabic message', async () => {
            const result = await runValidation(registerRules, {
                name: 'مستخدم',
                email: 'test@drivehub.local',
                password: 'weak',
            });
            expect(result.isEmpty()).toBe(false);
            expect(result.array().some((e) => e.msg.includes('كلمة المرور'))).toBe(true);
        });

        it('accepts valid register payload', async () => {
            const result = await runValidation(registerRules, {
                name: 'مستخدم تجريبي',
                email: 'test@drivehub.local',
                phone: '0501234567',
                password: strongPassword,
            });
            expect(result.isEmpty()).toBe(true);
        });

        it('rejects login without password', async () => {
            const result = await runValidation(loginRules, { email: 'a@b.com' });
            expect(result.array()[0].msg).toMatch(/كلمة المرور مطلوب/);
        });
    });

    describe('enrollment & courses', () => {
        it('rejects enrollment without courseId', async () => {
            const result = await runValidation(createEnrollmentRules, {
                schoolId: '507f1f77bcf86cd799439011',
                categoryCode: 'B',
            });
            expect(result.array().some((e) => e.path === 'courseId')).toBe(true);
        });

        it('rejects invalid license code', async () => {
            const result = await runValidation(createEnrollmentRules, {
                courseId: '507f1f77bcf86cd799439011',
                schoolId: '507f1f77bcf86cd799439012',
                categoryCode: 'INVALID',
            });
            expect(result.array().some((e) => e.path === 'categoryCode')).toBe(true);
        });

        it('accepts valid course creation', async () => {
            const result = await runValidation(createCourseRules, {
                schoolId: '507f1f77bcf86cd799439011',
                categoryCode: 'B',
                subTypeCode: 'B1',
                maxStudents: 60,
            });
            expect(result.isEmpty()).toBe(true);
        });
    });

    describe('schools & location', () => {
        it('requires lat/lng for nearby schools query', async () => {
            const result = await runValidation(nearbySchoolsQuery, {}, 'query');
            expect(result.array().some((e) => e.path === 'lat')).toBe(true);
            expect(result.array().some((e) => e.path === 'lng')).toBe(true);
        });

        it('rejects out-of-range coordinates', async () => {
            const result = await runValidation(nearbySchoolsQuery, { lat: 95, lng: 36 }, 'query');
            expect(result.array().some((e) => e.msg.includes('خط العرض'))).toBe(true);
        });

        it('accepts school application with required fields', async () => {
            const result = await runValidation(schoolApplicationRules, {
                schoolName: 'مدرسة النور',
                address: 'دمشق - المزة',
                lat: 33.5,
                lng: 36.3,
                phone: '0944123456',
                email: 'school@drivehub.local',
                licenses: ['B'],
            });
            expect(result.isEmpty()).toBe(true);
        });

        it('rejects school without address', async () => {
            const result = await runValidation(createSchoolRules, {
                name: 'مدرسة',
                lat: 33.5,
                lng: 36.3,
            });
            expect(result.array().some((e) => e.path === 'address')).toBe(true);
        });
    });

    describe('licenses, payments, documents', () => {
        it('validates license category upsert', async () => {
            const result = await runValidation(upsertCategoryRules, {
                code: 'B',
                name: 'خصوصي',
                minAge: 18,
            });
            expect(result.isEmpty()).toBe(true);
        });

        it('rejects payment confirm without amount', async () => {
            const result = await runValidation(confirmPaymentRules, {});
            expect(result.array().some((e) => e.path === 'amount')).toBe(true);
        });

        it('rejects invalid document type', async () => {
            const result = await runValidation(uploadDocumentRules, { type: 'passport' });
            expect(result.isEmpty()).toBe(false);
        });
    });

    describe('content, notifications, traffic, admin', () => {
        it('validates notification payload', async () => {
            const result = await runValidation(sendNotificationRules, {
                userId: '507f1f77bcf86cd799439011',
                type: 'course_launch',
                title: 'انطلاق الدورة',
                message: 'ستنطلق دورتك غداً',
            });
            expect(result.isEmpty()).toBe(true);
        });

        it('requires MCQ options', async () => {
            const result = await runValidation(createQuestionRules, {
                text: 'ما سرعة القيادة في المناطق السكنية؟',
                type: 'mcq',
                correctAnswer: 'A',
            });
            expect(result.array().some((e) => e.path === 'options')).toBe(true);
        });

        it('validates traffic exam schedule', async () => {
            const result = await runValidation(trafficScheduleRules, {
                governorate: 'دمشق',
                studentId: '507f1f77bcf86cd799439011',
                enrollmentId: '507f1f77bcf86cd799439012',
                examType: 'theory',
                examDate: '2026-07-01T09:00:00.000Z',
                branch: 'فرع المزة',
            });
            expect(result.isEmpty()).toBe(true);
        });

        it('validates school review rating range', async () => {
            const result = await runValidation(createReviewRules, {
                schoolId: '507f1f77bcf86cd799439011',
                rating: 6,
            });
            expect(result.isEmpty()).toBe(false);
        });

        it('validates platform pricing', async () => {
            const result = await runValidation(upsertPricingRules, {
                categoryCode: 'B',
                fixedPrice: 500000,
            });
            expect(result.isEmpty()).toBe(true);
        });
    });
});
