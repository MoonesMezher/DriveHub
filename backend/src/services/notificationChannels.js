const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let mailTransporter = null;

const getMailTransporter = () => {
    if (mailTransporter) return mailTransporter;

    const host = process.env.SMTP_HOST;
    if (!host) return null;

    mailTransporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
    });

    return mailTransporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!to || !from) {
        logger.warn('notification.email.skipped', { reason: 'missing_to_or_from' });
        return { sent: false, channel: 'email' };
    }

    const transporter = getMailTransporter();
    if (!transporter) {
        logger.warn('notification.email.skipped', { reason: 'smtp_not_configured' });
        return { sent: false, channel: 'email' };
    }

    await transporter.sendMail({ from, to, subject, text, html: html || text });
    logger.info('notification.email.sent', { to, subject });
    return { sent: true, channel: 'email' };
};

const sendSms = async ({ to, message }) => {
    const provider = process.env.SMS_PROVIDER || 'stub';
    if (!to) {
        logger.warn('notification.sms.skipped', { reason: 'missing_phone' });
        return { sent: false, channel: 'sms' };
    }

    if (provider === 'stub' || !process.env.SMS_API_KEY) {
        logger.info('notification.sms.stub', { to, message: message?.slice(0, 80) });
        return { sent: true, channel: 'sms', stub: true };
    }

    logger.warn('notification.sms.unconfigured', { provider });
    return { sent: false, channel: 'sms' };
};

const dispatch = async (channel, payload) => {
    if (channel === 'email') return sendEmail(payload);
    if (channel === 'sms') return sendSms(payload);
    return { sent: false, channel, reason: 'unknown_channel' };
};

module.exports = { sendEmail, sendSms, dispatch };
