/**
 * Minimal Gmail SMTP connectivity test. Run from backend/: node scripts/smtp-test.js
 * Does not log passwords.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const nodemailer = require('nodemailer');

const user = (process.env.SMTP_USER || '').trim();
const pass = (process.env.SMTP_PASS || '').trim().replace(/\s/g, '');
const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const port = Number(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE === 'true';

const mask = (s) => (s ? `${s.slice(0, 2)}***${s.slice(-2)} (len=${s.length})` : '(empty)');

console.log('--- SMTP test ---');
console.log('dotenv path:', path.resolve(__dirname, '..', '.env'));
console.log('host:', host);
console.log('port:', port, 'secure:', secure);
console.log('user:', user);
console.log('pass:', mask(pass));
console.log('SMTP_FROM raw:', JSON.stringify(process.env.SMTP_FROM));

const configs = [
    { label: '587 STARTTLS (requireTLS)', port: 587, secure: false, requireTLS: true },
    { label: '587 default', port: 587, secure: false },
    { label: '465 SSL', port: 465, secure: true },
];

(async () => {
    for (const cfg of configs) {
        const transporter = nodemailer.createTransport({
            host,
            port: cfg.port,
            secure: cfg.secure,
            requireTLS: cfg.requireTLS || false,
            auth: user ? { user, pass } : undefined,
        });

        try {
            await transporter.verify();
            console.log(`\n✓ ${cfg.label}: AUTH OK`);
            process.exit(0);
        } catch (err) {
            console.log(`\n✗ ${cfg.label}: ${err.message.split('\n')[0]}`);
        }
    }
    process.exit(1);
})();
