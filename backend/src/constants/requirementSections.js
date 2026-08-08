/** Sections of the public /requirements page managed via admin. */
const REQUIREMENT_SECTIONS = Object.freeze({
    JOURNEY: 'journey',
    DOCUMENTS: 'documents',
    STEPS: 'steps',
});

const REQUIREMENT_SECTION_VALUES = Object.freeze(Object.values(REQUIREMENT_SECTIONS));

module.exports = {
    REQUIREMENT_SECTIONS,
    REQUIREMENT_SECTION_VALUES,
};
