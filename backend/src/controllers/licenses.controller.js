const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { licenseService } = require('../services');
const ApiError = require('../utils/ApiError');
const { ERR } = require('../constants/errorMessages');

const list = asyncHandler(async (req, res) => success(res, await licenseService.list()));

const getByCode = asyncHandler(async (req, res) => {
    const license = await licenseService.getByCode(req.params.code);
    if (!license) throw new ApiError(404, ERR.LICENSE_NOT_FOUND);
    return success(res, license);
});

module.exports = { list, getByCode };
