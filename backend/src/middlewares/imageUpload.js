const multer = require('multer');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (!IMAGE_MIME.has(file.mimetype)) {
        return cb(new ApiError(400, ERR.INVALID_IMAGE_TYPE));
    }
    return cb(null, true);
};

const imageUpload = multer({
    storage,
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    fileFilter,
});

const handleImageUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(400, ERR.FILE_TOO_LARGE));
        }
        return next(new ApiError(400, err.message));
    }
    return next(err);
};

module.exports = {
    imageUpload,
    handleImageUploadError,
    IMAGE_MIME,
    MAX_IMAGE_SIZE,
};
