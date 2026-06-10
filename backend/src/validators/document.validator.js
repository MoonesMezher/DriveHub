const { DOCUMENT_TYPE_LIST } = require('../constants/documentTypes');
const msg = require('./messages');
const { requiredEnumBody } = require('./chains');

const uploadDocumentRules = [
    requiredEnumBody('type', 'نوع المستند', DOCUMENT_TYPE_LIST),
];

module.exports = {
    uploadDocumentRules,
};
