const mongoose = require('mongoose');

const MEDIA_PATH_RE = /^\/api\/v1\/media\/[a-f0-9]{24}$/i;
const EXTERNAL_URL_RE = /^https?:\/\//i;

const isExternalImageUrl = (value) => Boolean(value && EXTERNAL_URL_RE.test(String(value).trim()));

const toMediaPath = (value) => {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    if (isExternalImageUrl(trimmed)) return null;
    if (MEDIA_PATH_RE.test(trimmed)) return trimmed;
    if (mongoose.Types.ObjectId.isValid(trimmed)) return `/api/v1/media/${trimmed}`;
    return null;
};

const mediaIdFromRef = (value) => {
    if (!value) return null;
    const trimmed = String(value).trim();
    const fromPath = trimmed.match(/\/api\/v1\/media\/([a-f0-9]{24})$/i);
    if (fromPath) return fromPath[1];
    if (mongoose.Types.ObjectId.isValid(trimmed)) return trimmed;
    return null;
};

module.exports = {
    MEDIA_PATH_RE,
    isExternalImageUrl,
    toMediaPath,
    mediaIdFromRef,
};
