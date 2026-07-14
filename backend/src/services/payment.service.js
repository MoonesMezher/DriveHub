const { Payment, Enrollment, PlatformPricing, TrainingCourse, User, UserRole, DrivingSchool, WalletTransaction } = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { ROLES } = require('../constants/roles');
const { splitPayment } = require('../helpers/payment.helper');
const { getRetakePaymentPercentage } = require('../utils/retakePayment');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const config = require('../config');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');
const { sendInstant } = require('../helpers/notificationDelivery.helper');
const { buildAlternateSchoolSuggestions } = require('../helpers/enrollmentSuggestions.helper');

class PaymentService {
    async getPricing(categoryCode, subTypeCode = null) {
        const code = categoryCode.toUpperCase();
        const sub = subTypeCode?.toUpperCase() || null;

        let pricing = await PlatformPricing.findOne({
            categoryCode: code,
            subTypeCode: sub,
            isActive: true,
        }).sort({ effectiveFrom: -1 });

        if (!pricing && sub) {
            pricing = await PlatformPricing.findOne({
                categoryCode: code,
                subTypeCode: null,
                isActive: true,
            }).sort({ effectiveFrom: -1 });
        }

        if (!pricing) {
            throw new ApiError(404, ERR.PRICING_NOT_FOUND);
        }
        return pricing;
    }

    calculateInitial(amount, commissionRate = config.platform.commission) {
        return {
            type: 'initial',
            percentage: 100,
            ...splitPayment(amount, commissionRate),
        };
    }

    calculateRetake(basePrice, attemptNumber, commissionRate = config.platform.commission) {
        const percentage = getRetakePaymentPercentage(attemptNumber);
        const amount = Math.round((basePrice * percentage) / 100);
        return {
            type: 'retake',
            attemptNumber,
            percentage,
            ...splitPayment(amount, commissionRate),
        };
    }

    validateAmount(expected, received) {
        if (Math.abs(expected - received) > 0.01) {
            throw new ApiError(400, ERR.PAYMENT_AMOUNT_MISMATCH);
        }
    }

    isRetakeEnrollment(enrollment) {
        return (enrollment.retakeAttempt ?? 0) >= 1;
    }

    paymentTypeFor(enrollment) {
        return this.isRetakeEnrollment(enrollment) ? 'retake' : 'initial';
    }

    async assertAwaitingPayment(enrollment) {
        const allowed = [ENROLLMENT_STATUS.ACCEPTED, ENROLLMENT_STATUS.AWAITING_PAYMENT];
        if (!allowed.includes(enrollment.status)) {
            throw new ApiError(400, 'الطلب ليس في مرحلة انتظار الدفع');
        }
        if (enrollment.paymentDeadline && enrollment.paymentDeadline < new Date()) {
            throw new ApiError(400, ERR.PAYMENT_DEADLINE_EXPIRED);
        }
    }

    async transitionToAwaitingPayment(enrollment) {
        if (enrollment.status === ENROLLMENT_STATUS.ACCEPTED) {
            enrollment.status = ENROLLMENT_STATUS.AWAITING_PAYMENT;
            await enrollment.save();
        }
    }

    async getSchoolPaymentInfo(schoolId) {
        return DrivingSchool.findById(schoolId)
            .select('+bankAccount name phone address governorate')
            .lean();
    }

    async findOrCreatePending(enrollment) {
        const type = this.paymentTypeFor(enrollment);
        const retakeFilter = type === 'retake'
            ? { retakeAttempt: enrollment.retakeAttempt }
            : {};

        const existingCompleted = await Payment.findOne({
            enrollmentId: enrollment._id,
            status: 'completed',
            type,
            ...retakeFilter,
        });
        if (existingCompleted) {
            throw new ApiError(409, ERR.PAYMENT_ALREADY_COMPLETED);
        }

        let pending = await Payment.findOne({
            enrollmentId: enrollment._id,
            status: 'pending',
            type,
            ...retakeFilter,
        }).sort({ createdAt: -1 });

        if (pending) {
            const pricing = await this.getPricing(enrollment.categoryCode, enrollment.subTypeCode);
            const breakdown = type === 'retake'
                ? this.calculateRetake(pricing.fixedPrice, enrollment.retakeAttempt)
                : this.calculateInitial(pricing.fixedPrice);
            return { payment: pending, pricing, breakdown };
        }

        const pricing = await this.getPricing(enrollment.categoryCode, enrollment.subTypeCode);
        const calc = type === 'retake'
            ? this.calculateRetake(pricing.fixedPrice, enrollment.retakeAttempt)
            : this.calculateInitial(pricing.fixedPrice);

        pending = await Payment.create({
            enrollmentId: enrollment._id,
            userId: enrollment.userId,
            schoolId: enrollment.schoolId,
            amount: calc.amount,
            schoolShare: calc.schoolShare,
            platformShare: calc.platformShare,
            commissionRate: calc.commissionRate,
            type,
            retakeAttempt: type === 'retake' ? enrollment.retakeAttempt : 0,
            retakePercentage: type === 'retake' ? calc.percentage : null,
            status: 'pending',
        });

        return { payment: pending, pricing, breakdown: calc };
    }

    async initiate({ enrollmentId, userId }) {
        const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId });
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        await this.assertAwaitingPayment(enrollment);
        await this.transitionToAwaitingPayment(enrollment);

        const result = await this.findOrCreatePending(enrollment);
        const school = await this.getSchoolPaymentInfo(enrollment.schoolId);
        const walletBalance = await User.findById(userId).select('walletBalance').lean();

        return {
            ...result,
            school,
            walletBalance: walletBalance?.walletBalance ?? 0,
        };
    }

    async payFromWallet({ enrollmentId, userId }) {
        const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId });
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        await this.assertAwaitingPayment(enrollment);
        await this.transitionToAwaitingPayment(enrollment);

        const result = await this.findOrCreatePending(enrollment);
        const pending = result.payment;
        const amount = pending.amount;

        const user = await User.findOneAndUpdate(
            { _id: userId, walletBalance: { $gte: amount } },
            { $inc: { walletBalance: -amount } },
            { new: true, runValidators: true },
        );

        if (!user) {
            const current = await User.findById(userId).select('walletBalance').lean();
            throw new ApiError(400, ERR.WALLET_INSUFFICIENT_BALANCE(current?.walletBalance ?? 0));
        }

        await WalletTransaction.create({
            userId,
            type: 'enrollment_payment',
            amount,
            balanceAfter: user.walletBalance,
            enrollmentId: enrollment._id,
            paymentId: pending._id,
            note: `دفع اشتراك فئة ${enrollment.categoryCode}`,
        });

        pending.status = 'completed';
        pending.paidAt = new Date();
        pending.gateway = 'wallet';
        pending.gatewayRef = `WALLET-${pending._id}`;
        await pending.save();

        enrollment.status = ENROLLMENT_STATUS.PAID;
        enrollment.paidAt = new Date();
        await enrollment.save();

        if (this.isRetakeEnrollment(enrollment)) {
            await this._afterRetakePaid(enrollment, pending);
        } else {
            await this._afterInitialPaid(enrollment, pending);
        }

        return { payment: pending, enrollment, walletBalance: user.walletBalance };
    }

    async claim({ enrollmentId, userId, studentReference = null }) {
        const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId });
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        await this.assertAwaitingPayment(enrollment);
        await this.transitionToAwaitingPayment(enrollment);

        const result = await this.findOrCreatePending(enrollment);
        result.payment.studentReference = studentReference || null;
        result.payment.studentClaimedAt = new Date();
        await result.payment.save();

        const school = await this.getSchoolPaymentInfo(enrollment.schoolId);

        return { ...result, enrollment, school };
    }

    async assertStaffCanConfirm(enrollment, schoolScope) {
        if (schoolScope && String(enrollment.schoolId) !== String(schoolScope)) {
            throw new ApiError(403, ERR.ACTION_DENIED);
        }
    }

    async confirmByStaff({
        enrollmentId,
        confirmedByUserId,
        schoolScope = null,
        amount,
        gatewayRef = null,
    }) {
        const enrollment = await Enrollment.findById(enrollmentId);
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        await this.assertAwaitingPayment(enrollment);
        await this.transitionToAwaitingPayment(enrollment);
        await this.assertStaffCanConfirm(enrollment, schoolScope);

        const result = await this.findOrCreatePending(enrollment);
        const pending = result.payment;

        this.validateAmount(pending.amount, Number(amount));

        pending.status = 'completed';
        pending.paidAt = new Date();
        pending.gatewayRef = gatewayRef;
        pending.confirmedBy = confirmedByUserId;
        await pending.save();

        enrollment.status = ENROLLMENT_STATUS.PAID;
        enrollment.paidAt = new Date();
        await enrollment.save();

        if (this.isRetakeEnrollment(enrollment)) {
            await this._afterRetakePaid(enrollment, pending);
        } else {
            await this._afterInitialPaid(enrollment, pending);
        }

        return { payment: pending, enrollment };
    }

    async _afterInitialPaid(enrollment, pending) {
        const userId = enrollment.userId;

        const course = await TrainingCourse.findByIdAndUpdate(
            enrollment.courseId,
            { $inc: { paidCount: 1 } },
            { new: true },
        );

        const courseHelper = require('../helpers/course.helper');
        const courseService = require('./course.service');
        const enrollmentService = require('./enrollment.service');

        if (course && courseHelper.isCourseFull(course)) {
            await courseService.closeRegistration(course._id);
            const waiters = await require('../models').WaitingList.find({
                courseId: course._id,
                status: 'waiting',
            });
            for (const waiter of waiters) {
                await enrollmentService.promoteNextFromWaitlist(course._id);
                break;
            }
            const school = await DrivingSchool.findById(enrollment.schoolId).select('governorate lat lng').lean();
            const suggestions = await buildAlternateSchoolSuggestions({
                categoryCode: enrollment.categoryCode,
                subTypeCode: enrollment.subTypeCode,
                governorate: school?.governorate,
                lat: school?.lat,
                lng: school?.lng,
            });
            for (const waiter of waiters) {
                await sendInstant(waiter.userId, {
                    type: NOTIFICATION_TYPES.GENERAL,
                    title: 'الدورة ممتلئة',
                    message: 'اكتملت أماكن الدورة. تمت ترقية من في قائمة الانتظار أو سيتم إبلاغكم لاحقاً.',
                    data: { courseId: course._id },
                    suggestions,
                });
            }
        }

        await UserRole.findOneAndUpdate(
            { userId, role: ROLES.STUDENT, schoolId: enrollment.schoolId },
            {
                userId,
                role: ROLES.STUDENT,
                schoolId: enrollment.schoolId,
                licenseCategories: [enrollment.categoryCode],
                status: 'active',
            },
            { upsert: true, new: true },
        );

        await User.updateOne(
            { _id: userId },
            {
                $set: {
                    'activeContext.role': ROLES.STUDENT,
                    'activeContext.schoolId': enrollment.schoolId,
                },
            },
        );

        const contentService = require('./content.service');
        await contentService.grantFullContentAccess(
            userId,
            enrollment.categoryCode,
            enrollment._id,
        );

        await sendInstant(userId, {
            type: NOTIFICATION_TYPES.GENERAL,
            title: pending.gateway === 'wallet' ? 'تم الدفع من الرصيد' : 'تم تأكيد الدفع',
            message: pending.gateway === 'wallet'
                ? 'تم خصم المبلغ من رصيدك وحجز مقعدك. انتظر انطلاق الدورة.'
                : 'أكّدت المدرسة/الإدارة استلام دفعتك. انتظر انطلاق الدورة.',
            data: { enrollmentId: enrollment._id, paymentId: pending._id },
        });
    }

    async _afterRetakePaid(enrollment, pending) {
        const { resetStudentProgress } = require('../helpers/studentProgress.helper');
        await resetStudentProgress(enrollment._id, enrollment.userId, enrollment.retakeScope || 'full');

        const contentService = require('./content.service');
        await contentService.grantFullContentAccess(
            enrollment.userId,
            enrollment.categoryCode,
            enrollment._id,
        );

        await sendInstant(enrollment.userId, {
            type: NOTIFICATION_TYPES.GENERAL,
            title: pending.gateway === 'wallet' ? 'تم دفع الإعادة من الرصيد' : 'تم تأكيد دفع الإعادة',
            message: pending.gateway === 'wallet'
                ? 'تم خصم مبلغ إعادة الاشتراك من رصيدك. يمكنك متابعة التدريب حسب نطاق الإعادة.'
                : 'أكّدت المدرسة/الإدارة استلام دفع إعادة الاشتراك. يمكنك متابعة التدريب حسب نطاق الإعادة.',
            data: {
                enrollmentId: enrollment._id,
                paymentId: pending._id,
                retakeScope: enrollment.retakeScope,
            },
        });
    }

    // Backward-compatible aliases for retake-specific callers
    async initiateRetake(params) {
        return this.initiate(params);
    }

    async claimRetake(params) {
        return this.claim(params);
    }

    async confirmRetakeByStaff(params) {
        return this.confirmByStaff(params);
    }

    async payRetakeFromWallet(params) {
        return this.payFromWallet(params);
    }
}

module.exports = new PaymentService();
