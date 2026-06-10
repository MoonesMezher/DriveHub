const pick = (obj, keys) =>
    keys.reduce((acc, key) => {
        if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});

const omit = (obj, keys) => {
    const clone = { ...obj };
    keys.forEach((key) => delete clone[key]);
    return clone;
};

module.exports = { pick, omit };
