const { ERR } = require('../constants/errorMessages');

const id = (req, res, next) => {
    if (!req.params.id || !/^[a-f\d]{24}$/i.test(req.params.id)) {
        return res.status(400).json({ success: false, message: ERR.INVALID_ID });
    }
    return next();
};

module.exports = id;
