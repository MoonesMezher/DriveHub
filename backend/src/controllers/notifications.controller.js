const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { notificationService } = require('../services');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');
const { parsePagination } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
    const { page, limit } = parsePagination(req.query);
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = await notificationService.listForUser(req._user.userId, { page, limit, unreadOnly });
    return success(res, { notifications: result.items }, {
        meta: { pagination: { page: result.page, limit: result.limit, total: result.total } },
    });
});

const markRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markRead(req.params.id, req._user.userId);
    if (!notification) throw new ApiError(404, ERR.NOTIFICATION_NOT_FOUND);
    return success(res, { notification }, { message: 'تم تعليم الإشعار كمقروء' });
});

const markAllRead = asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req._user.userId);
    return success(res, null, { message: 'تم تعليم جميع الإشعارات كمقروءة' });
});

module.exports = { list, markRead, markAllRead };
