const crypto = require('crypto');
const { StudentStatistics, DrivingLicenseRecord, User, Enrollment } = require('../models');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

const buildStatisticsPayload = (stats, enrollment, user) => ({
    type: 'student_statistics',
    statisticsId: String(stats._id),
    userId: String(stats.userId),
    studentName: user?.name || null,
    enrollmentId: String(stats.enrollmentId),
    categoryCode: enrollment?.categoryCode || null,
    progressPercent: stats.progressPercent ?? 0,
    lessonsCompleted: stats.lessonsCompleted ?? 0,
    attendancePercent: stats.attendancePercent ?? 0,
    issuedAt: new Date().toISOString(),
    issuedBy: 'DriveHub',
});

const buildCertificatePayload = (record, user) => ({
    type: 'driving_license',
    recordId: String(record._id),
    userId: String(record.userId),
    studentName: user?.name || null,
    categoryCode: record.categoryCode,
    subTypeCode: record.subTypeCode || null,
    certificateNumber: record.certificateNumber || null,
    issueDate: record.issueDate?.toISOString?.() || record.issueDate,
    issuer: record.issuer || 'وزارة النقل',
    issuedBy: 'DriveHub',
});

class VerificationService {
    async ensureStatisticsToken(enrollmentId) {
        let stats = await StudentStatistics.findOne({ enrollmentId });
        if (!stats) return null;

        if (!stats.verificationToken) {
            const enrollment = await Enrollment.findById(enrollmentId)
                .select('categoryCode subTypeCode status userId')
                .lean();
            if (!stats.userId && enrollment?.userId) {
                stats.userId = enrollment.userId;
            }
            const user = await User.findById(stats.userId).select('name').lean();
            stats.verificationToken = crypto.randomBytes(32).toString('hex');
            stats.qrPayload = buildStatisticsPayload(stats, enrollment, user);
            await stats.save();
        }

        return {
            verificationToken: stats.verificationToken,
            qrPayload: stats.qrPayload,
            verifyPath: `/verify/statistics/${stats.verificationToken}`,
        };
    }

    async verifyStatistics(token, auditMeta = {}) {
        const stats = await StudentStatistics.findOne({ verificationToken: token })
            .populate('userId', 'name')
            .lean();
        if (!stats) throw new ApiError(404, ERR.NOT_FOUND);

        const enrollment = await Enrollment.findById(stats.enrollmentId)
            .select('categoryCode subTypeCode status schoolId')
            .populate('schoolId', 'name')
            .lean();

        const auditService = require('./audit.service');
        await auditService.log({
            action: 'statistics.verify',
            entityType: 'StudentStatistics',
            entityId: stats._id,
            metadata: {
                token: token.slice(0, 8),
                ip: auditMeta.ip || null,
                userAgent: auditMeta.userAgent || null,
            },
        });

        return {
            valid: true,
            type: 'student_statistics',
            studentName: stats.userId?.name || null,
            categoryCode: enrollment?.categoryCode || null,
            enrollmentStatus: enrollment?.status || null,
            school: enrollment?.schoolId || null,
            progressPercent: stats.progressPercent ?? 0,
            lessonsCompleted: stats.lessonsCompleted ?? 0,
            lessonsTotal: stats.lessonsTotal ?? 0,
            attendancePercent: stats.attendancePercent ?? 0,
            practiceAttempts: stats.practiceScores?.length ?? 0,
            qrPayload: stats.qrPayload,
            verifiedAt: new Date().toISOString(),
        };
    }

    async ensureCertificateToken(recordId) {
        const record = await DrivingLicenseRecord.findById(recordId);
        if (!record) return null;

        if (!record.verificationToken) {
            const user = await User.findById(record.userId).select('name').lean();
            record.verificationToken = crypto.randomBytes(32).toString('hex');
            record.qrPayload = buildCertificatePayload(record, user);
            await record.save();
        }

        return {
            verificationToken: record.verificationToken,
            qrPayload: record.qrPayload,
            verifyPath: `/verify/certificate/${record.verificationToken}`,
        };
    }

    async verifyCertificate(token, auditMeta = {}) {
        const record = await DrivingLicenseRecord.findOne({ verificationToken: token })
            .populate('userId', 'name')
            .lean();
        if (!record) throw new ApiError(404, ERR.NOT_FOUND);

        const auditService = require('./audit.service');
        await auditService.log({
            action: 'certificate.verify',
            entityType: 'DrivingLicenseRecord',
            entityId: record._id,
            metadata: {
                token: token.slice(0, 8),
                ip: auditMeta.ip || null,
                userAgent: auditMeta.userAgent || null,
            },
        });

        return {
            valid: true,
            type: 'driving_license',
            studentName: record.userId?.name || null,
            categoryCode: record.categoryCode,
            subTypeCode: record.subTypeCode,
            certificateNumber: record.certificateNumber,
            issueDate: record.issueDate,
            issuer: record.issuer,
            qrPayload: record.qrPayload,
            verifiedAt: new Date().toISOString(),
        };
    }

    async verifyRoster(token, auditMeta = {}) {
        const rosterService = require('./roster.service');
        return rosterService.verifyByToken(token, auditMeta);
    }
}

module.exports = new VerificationService();
