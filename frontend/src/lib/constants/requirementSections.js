export const REQUIREMENT_SECTIONS = {
  JOURNEY: 'journey',
  DOCUMENTS: 'documents',
  STEPS: 'steps',
}

export const REQUIREMENT_SECTION_TABS = [
  {
    id: REQUIREMENT_SECTIONS.JOURNEY,
    label: 'رحلة التسجيل',
    icon: 'route',
    description: 'خطوات الرحلة البصرية — تظهر أعلى صفحة /requirements',
  },
  {
    id: REQUIREMENT_SECTIONS.DOCUMENTS,
    label: 'المستندات والشروط',
    icon: 'folder',
    description: 'بطاقات المستندات والشروط المطلوبة',
  },
  {
    id: REQUIREMENT_SECTIONS.STEPS,
    label: 'خطوات التسجيل',
    icon: 'format_list_numbered',
    description: 'القائمة المرقّمة لخطوات التسجيل',
  },
]
