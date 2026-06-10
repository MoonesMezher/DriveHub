const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(new ApiError(400, ERR.INVALID_FILE_TYPE));
    }
    return cb(null, true);
};

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE, files: 2 },
    fileFilter,
});

const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(400, ERR.FILE_TOO_LARGE));
        }
        return next(new ApiError(400, err.message));
    }
    return next(err);
};

module.exports = { upload, handleUploadError, ALLOWED_MIME, MAX_FILE_SIZE };
