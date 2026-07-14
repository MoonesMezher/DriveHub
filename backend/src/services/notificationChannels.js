const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let mailProvider = null;

const parseAddress = () => {
    const name = process.env.MAIL_FROM_NAME || 'DriveHub';
    const raw = process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!raw) {
        return { name, address: 'sandbox@example.com' };
    }

    const match = raw.match(/^"?([^"<]+)"?\s*<([^>]+)>$/);
    if (match) {
        return { name: match[1].trim(), address: match[2].trim() };
    }

    return { name, address: raw.trim() };
};

const getMailFrom = () => {
    const { address, name } = parseAddress();
    return `"${name}" <${address}>`;
};

const initMailProvider = () => {
    if (mailProvider) return mailProvider;

    const host = (process.env.SMTP_HOST || '').trim();
    if (host) {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === 'true';
        const user = (process.env.SMTP_USER || '').trim();
        const pass = (process.env.SMTP_PASS || '').trim().replace(/\s/g, '');

        mailProvider = {
            type: 'smtp',
            transporter: nodemailer.createTransport({
                host,
                port,
                secure,
                requireTLS: !secure && port === 587,
                auth: user ? { user, pass } : undefined,
            }),
        };
        logger.info('notification.email.transport', { provider: 'smtp', host });
        return mailProvider;
    }

    const token = (process.env.MAILTRAP_API_TOKEN || '').trim();
    const useSandbox = process.env.MAILTRAP_USE_SANDBOX === 'true';
    const inboxId = Number(process.env.MAILTRAP_INBOX_ID);

    if (useSandbox && token && inboxId) {
        const { MailtrapClient } = require('mailtrap');
        mailProvider = {
            type: 'sandbox',
            client: new MailtrapClient({
                token,
                sandbox: true,
                testInboxId: inboxId,
            }),
        };
        logger.info('notification.email.transport', { provider: 'mailtrap-sandbox', inboxId });
        return mailProvider;
    }

    if (token) {
        const { MailtrapTransport } = require('mailtrap');
        mailProvider = {
            type: 'mailtrap',
            transporter: nodemailer.createTransport(
                MailtrapTransport({ token }),
            ),
        };
        logger.info('notification.email.transport', { provider: 'mailtrap-sending' });
        return mailProvider;
    }

    mailProvider = { type: 'none' };
    return mailProvider;
};

/** @deprecated Use initMailProvider — kept for tests and backward compatibility */
const getMailTransporter = () => {
    const provider = initMailProvider();
    return provider.transporter || null;
};

const sendEmail = async ({ to, subject, text, html }) => {
    if (!to) {
        logger.warn('notification.email.skipped', { reason: 'missing_to' });
        return { sent: false, channel: 'email' };
    }

    const from = getMailFrom();
    const { address, name } = parseAddress();
    const provider = initMailProvider();

    if (provider.type === 'sandbox') {
        await provider.client.send({
            from: { name, email: address },
            to: [{ email: to }],
            subject,
            text,
            html: html || text,
        });
        logger.info('notification.email.sent', { to, subject, provider: 'mailtrap-sandbox' });
        return { sent: true, channel: 'email' };
    }

    if (provider.transporter) {
        await provider.transporter.sendMail({ from, to, subject, text, html: html || text });
        logger.info('notification.email.sent', { to, subject, provider: provider.type });
        return { sent: true, channel: 'email' };
    }

    const preview = (text || html || '').slice(0, 300);
    logger.info('notification.email.dev', { to, subject, preview });
    if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`\n[DriveHub EMAIL — no Mailtrap token or SMTP configured]\nFrom: ${from}\nTo: ${to}\nSubject: ${subject}\n${text || html || ''}\n`);
    }
    return { sent: true, channel: 'email', dev: true };
};

const dispatch = async (channel, payload) => {
    if (channel === 'email') return sendEmail(payload);
    logger.debug('notification.channel.skipped', { channel });
    return { sent: false, channel, reason: 'unsupported_channel' };
};

module.exports = { sendEmail, dispatch, getMailFrom, getMailTransporter, initMailProvider };
