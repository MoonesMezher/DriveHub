/**
 * التحقق من توقيع الملف (magic bytes) — لا يعتمد على MIME المرسل من المتصفح فقط.
 */
const SIGNATURES = [
    {
        mime: 'image/jpeg',
        check: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
    },
    {
        mime: 'image/png',
        check: (buf) =>
            buf.length >= 8
            && buf[0] === 0x89
            && buf[1] === 0x50
            && buf[2] === 0x4e
            && buf[3] === 0x47
            && buf[4] === 0x0d
            && buf[5] === 0x0a
            && buf[6] === 0x1a
            && buf[7] === 0x0a,
    },
    {
        mime: 'image/webp',
        check: (buf) =>
            buf.length >= 12
            && buf.toString('ascii', 0, 4) === 'RIFF'
            && buf.toString('ascii', 8, 12) === 'WEBP',
    },
    {
        mime: 'application/pdf',
        check: (buf) => buf.length >= 5 && buf.toString('ascii', 0, 5) === '%PDF-',
    },
];

const detectMimeFromBuffer = (buffer) => {
    if (!buffer?.length) return null;
    const match = SIGNATURES.find(({ check }) => check(buffer));
    return match?.mime || null;
};

const mimeMatchesBuffer = (buffer, declaredMime) => {
    const detected = detectMimeFromBuffer(buffer);
    if (!detected) return false;
    return detected === declaredMime;
};

module.exports = { detectMimeFromBuffer, mimeMatchesBuffer, SIGNATURES };
