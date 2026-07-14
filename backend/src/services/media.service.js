const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { MediaAsset } = require('../models');
const { mimeMatchesBuffer } = require('../utils/fileSignature');
const { toMediaPath } = require('../utils/mediaRef');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { IMAGE_MIME, MAX_IMAGE_SIZE } = require('../middlewares/imageUpload');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/media');

class MediaService {
    async ensureUploadDir() {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }

    validateImageFile(file) {
        if (!file) throw new ApiError(400, ERR.NO_FILE);
        if (!IMAGE_MIME.has(file.mimetype)) {
            throw new ApiError(400, ERR.INVALID_IMAGE_TYPE);
        }
        if (file.size > MAX_IMAGE_SIZE) {
            throw new ApiError(400, ERR.FILE_TOO_LARGE);
        }
        if (!file.buffer?.length || !mimeMatchesBuffer(file.buffer, file.mimetype)) {
            throw new ApiError(400, ERR.FILE_SIGNATURE_MISMATCH);
        }
    }

    mediaUrlFor(id) {
        return `/api/v1/media/${id}`;
    }

    async storeImage({ file, uploadedBy, category = 'general', isPublic = true }) {
        this.validateImageFile(file);
        await this.ensureUploadDir();

        const ext = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
        }[file.mimetype] || '.bin';
        const storedName = `${crypto.randomUUID()}${ext}`;
        const fullPath = path.join(UPLOAD_DIR, storedName);

        await fs.writeFile(fullPath, file.buffer);

        const asset = await MediaAsset.create({
            storedName,
            mime: file.mimetype,
            originalName: file.originalname,
            size: file.size,
            uploadedBy,
            category,
            isPublic,
        });

        return {
            asset,
            url: this.mediaUrlFor(asset._id),
        };
    }

    async getAsset(id) {
        const asset = await MediaAsset.findById(id);
        if (!asset) throw new ApiError(404, ERR.MEDIA_NOT_FOUND);
        return asset;
    }

    async readFileBuffer(asset) {
        const fullPath = path.join(UPLOAD_DIR, asset.storedName);
        try {
            return await fs.readFile(fullPath);
        } catch {
            throw new ApiError(404, ERR.MEDIA_NOT_FOUND);
        }
    }

    normalizeImageRef(value, { required = false } = {}) {
        if (!value) {
            if (required) throw new ApiError(400, ERR.IMAGE_UPLOAD_REQUIRED);
            return null;
        }
        if (String(value).trim().match(/^https?:\/\//i)) {
            throw new ApiError(400, ERR.EXTERNAL_IMAGE_URL_REJECTED);
        }
        const normalized = toMediaPath(value);
        if (!normalized) throw new ApiError(400, ERR.INVALID_MEDIA_REF);
        return normalized;
    }

    async assertMediaExists(ref) {
        const id = ref?.match(/([a-f0-9]{24})$/i)?.[1];
        if (!id) throw new ApiError(400, ERR.INVALID_MEDIA_REF);
        await this.getAsset(id);
        return ref;
    }
}

module.exports = new MediaService();
