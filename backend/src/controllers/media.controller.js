const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const mediaService = require('../services/media.service');
const { imageUpload } = require('../middlewares/imageUpload');

const uploadImage = asyncHandler(async (req, res) => {
    const category = req.body.category || 'general';
    const { asset, url } = await mediaService.storeImage({
        file: req.file,
        uploadedBy: req._user.userId,
        category,
        isPublic: true,
    });

    return created(res, {
        media: {
            id: asset._id,
            url,
            mime: asset.mime,
            originalName: asset.originalName,
            size: asset.size,
        },
    }, 'تم رفع الصورة');
});

const serveImage = asyncHandler(async (req, res) => {
    const asset = await mediaService.getAsset(req.params.id);
    const buffer = await mediaService.readFileBuffer(asset);

    res.setHeader('Content-Type', asset.mime);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(asset.originalName)}"`);
    return res.send(buffer);
});

module.exports = {
    uploadImage,
    serveImage,
    uploadMiddleware: imageUpload.single('file'),
};
