const { Payment, Enrollment, PlatformPricing, TrainingCourse, User, UserRole } = require('../models');
const { ENROLLMENT_STATUS } = require('../constants/enrollmentStatus');
const { ROLES } = require('../constants/roles');
const { splitPayment } = require('../helpers/payment.helper');
const { getRetakePaymentPercentage } = require('../utils/retakePayment');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const config = require('../config');
const { NOTIFICATION_TYPES } = require('../constants/notificationTypes');

class PaymentService {
    async getPricing(categoryCode, subTypeCode = null) {
        const pricing = await PlatformPricing.findOne({
            categoryCode: categoryCode.toUpperCase(),
            subTypeCode: subTypeCode?.toUpperCase() || null,
            isActive: true,
        }).sort({ effectiveFrom: -1 });

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

    async initiate({ enrollmentId, userId }) {
        const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId });
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        if (enrollment.status !== ENROLLMENT_STATUS.AWAITING_PAYMENT) {
            throw new ApiError(400, 'الطلب ليس في مرحلة انتظار الدفع');
        }

        if (enrollment.paymentDeadline && enrollment.paymentDeadline < new Date()) {
            throw new ApiError(400, ERR.PAYMENT_DEADLINE_EXPIRED);
        }

        const existing = await Payment.findOne({
            enrollmentId,
            status: 'completed',
            type: 'initial',
        });
        if (existing) throw new ApiError(409, ERR.PAYMENT_ALREADY_COMPLETED);

        const pricing = await this.getPricing(enrollment.categoryCode, enrollment.subTypeCode);
        const calc = this.calculateInitial(pricing.fixedPrice);

        const payment = await Payment.create({
            enrollmentId,
            userId,
            schoolId: enrollment.schoolId,
            amount: calc.amount,
            schoolShare: calc.schoolShare,
            platformShare: calc.platformShare,
            commissionRate: calc.commissionRate,
            type: 'initial',
            status: 'pending',
        });

        return { payment, pricing, breakdown: calc };
    }

    async confirm({ enrollmentId, userId, amount, gatewayRef = null }) {
        const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId });
        if (!enrollment) throw new ApiError(404, ERR.ENROLLMENT_NOT_FOUND);

        const pending = await Payment.findOne({
            enrollmentId: enrollment._id,
            userId: enrollment.userId,
            status: 'pending',
            type: 'initial',
        }).sort({ createdAt: -1 });

        if (!pending) throw new ApiError(404, ERR.PAYMENT_NOT_FOUND);

        this.validateAmount(pending.amount, Number(amount));

        pending.status = 'completed';
        pending.paidAt = new Date();
        pending.gatewayRef = gatewayRef;
        await pending.save();

        enrollment.status = ENROLLMENT_STATUS.PAID;
        enrollment.paidAt = new Date();
        await enrollment.save();

        await TrainingCourse.findByIdAndUpdate(enrollment.courseId, {
            $inc: { paidCount: 1 },
        });

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

        const notificationService = require('./notification.service');
        await notificationService.send({
            userId,
            type: NOTIFICATION_TYPES.GENERAL,
            title: 'تم استلام الدفع',
            message: 'تم تأكيد دفعتك بنجاح. انتظر انطلاق الدورة.',
            data: { enrollmentId, paymentId: pending._id },
        });

        return { payment: pending, enrollment };
    }
}

module.exports = new PaymentService();
