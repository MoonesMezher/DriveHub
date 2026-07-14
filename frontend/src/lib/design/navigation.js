import { ROUTES } from '@/lib/constants/routes'
import { ROLES } from '@/lib/constants/roles'

export const PUBLIC_NAV = [
  { to: ROUTES.HOME, label: 'الرئيسية', icon: 'home', end: true },
  { to: ROUTES.LICENSES, label: 'الرخص', icon: 'badge' },
  { to: ROUTES.SCHOOLS_NEARBY, label: 'المدارس', icon: 'location_on' },
  { to: ROUTES.REQUIREMENTS, label: 'المتطلبات', icon: 'checklist' },
  { to: ROUTES.FAQ, label: 'الأسئلة الشائعة', icon: 'help' },
]

export const PUBLIC_FOOTER_NAV = [
  { to: ROUTES.HOME, label: 'الرئيسية' },
  { to: ROUTES.LICENSES, label: 'الرخص' },
  { to: ROUTES.SCHOOLS_NEARBY, label: 'المدارس' },
  { to: ROUTES.REQUIREMENTS, label: 'المتطلبات' },
  { to: ROUTES.FAQ, label: 'الأسئلة الشائعة' },
  { to: ROUTES.SAMPLE, label: 'عينة مجانية' },
  { to: ROUTES.PRIVACY, label: 'سياسة الخصوصية' },
]

export const SIDEBAR_BY_ROLE = {
  [ROLES.STUDENT]: {
    subtitle: 'بوابة الطالب',
    items: [
      { to: ROUTES.STUDENT, label: 'لوحة التحكم', icon: 'dashboard', end: true },
      { to: `${ROUTES.STUDENT}/statistics`, label: 'إحصائياتي', icon: 'monitoring' },
      { to: `${ROUTES.STUDENT}/theory`, label: 'التعلم النظري', icon: 'menu_book' },
      { to: `${ROUTES.STUDENT}/videos`, label: 'فيديوهات عملية', icon: 'play_circle' },
      { to: `${ROUTES.STUDENT}/practice`, label: 'اختبارات تجريبية', icon: 'quiz' },
      { to: `${ROUTES.STUDENT}/lessons`, label: 'المواعيد', icon: 'calendar_today' },
      { to: `${ROUTES.STUDENT}/exam`, label: 'امتحان المرور', icon: 'fact_check' },
      { to: `${ROUTES.STUDENT}/certificates`, label: 'شهاداتي', icon: 'workspace_premium' },
      { to: `${ROUTES.STUDENT}/archive`, label: 'الأرشيف', icon: 'inventory_2' },
    ],
  },
  [ROLES.COACH]: {
    subtitle: 'بوابة المدرب',
    items: [
      { to: ROUTES.COACH, label: 'لوحة التحكم', icon: 'dashboard', end: true },
      { to: `${ROUTES.COACH}/schedule`, label: 'الجدول', icon: 'calendar_month' },
      { to: `${ROUTES.COACH}/lessons`, label: 'تقييم الدرس', icon: 'rate_review' },
      { to: `${ROUTES.COACH}/students`, label: 'الطلاب', icon: 'group' },
      { to: `${ROUTES.COACH}/notes`, label: 'الملاحظات', icon: 'edit_note' },
    ],
  },
  [ROLES.MANAGER]: {
    subtitle: 'إدارة المدرسة',
    items: [
      { to: ROUTES.MANAGER, label: 'لوحة التحكم', icon: 'dashboard', end: true },
      { to: `${ROUTES.MANAGER}/courses`, label: 'الدورات', icon: 'school' },
      { to: `${ROUTES.MANAGER}/schedule`, label: 'الجدول الشامل', icon: 'calendar_month' },
      { to: `${ROUTES.MANAGER}/enrollments`, label: 'طلبات الالتحاق', icon: 'person_add' },
      { to: `${ROUTES.MANAGER}/instructors`, label: 'المدربون', icon: 'supervisor_account' },
      { to: `${ROUTES.MANAGER}/question-banks`, label: 'بنوك الأسئلة', icon: 'quiz' },
      { to: `${ROUTES.MANAGER}/content`, label: 'محرر المحتوى', icon: 'article' },
      { to: `${ROUTES.MANAGER}/content-edits`, label: 'تعديلات المحتوى', icon: 'edit_note' },
      { to: `${ROUTES.MANAGER}/roster`, label: 'رفع الأسماء', icon: 'upload_file' },
    ],
  },
  [ROLES.ADMIN]: {
    subtitle: 'نظام الإدارة',
    variant: 'ultra',
    items: [
      { to: ROUTES.ADMIN, label: 'لوحة التحكم', icon: 'dashboard', end: true },
      { to: `${ROUTES.ADMIN}/schools`, label: 'المدارس', icon: 'domain' },
      { to: `${ROUTES.ADMIN}/pricing`, label: 'التسعير', icon: 'payments' },
      { to: `${ROUTES.ADMIN}/licenses`, label: 'فئات الرخص', icon: 'badge' },
      { to: `${ROUTES.ADMIN}/requirements`, label: 'متطلبات التسجيل', icon: 'checklist' },
      { to: `${ROUTES.ADMIN}/testimonials`, label: 'آراء المتعلّمين', icon: 'reviews' },
      { to: `${ROUTES.ADMIN}/faq`, label: 'الأسئلة الشائعة', icon: 'help' },
      { to: `${ROUTES.ADMIN}/compliance`, label: 'مراجعة الطلبات', icon: 'verified_user' },
      { to: `${ROUTES.ADMIN}/users`, label: 'المستخدمون', icon: 'manage_accounts' },
      { to: `${ROUTES.ADMIN}/reports`, label: 'التقارير', icon: 'monitoring' },
      { to: `${ROUTES.ADMIN}/ads`, label: 'الإعلانات', icon: 'campaign' },
      { to: `${ROUTES.ADMIN}/audit`, label: 'سجل التدقيق', icon: 'history' },
      { to: `${ROUTES.ADMIN}/settings`, label: 'الإعدادات', icon: 'settings' },
    ],
    cta: { label: 'إضافة مدرسة', icon: 'add_circle', to: `${ROUTES.ADMIN}/schools` },
  },
  [ROLES.TRAFFIC]: {
    subtitle: 'بوابة المرور',
    items: [
      { to: ROUTES.TRAFFIC, label: 'لوحة التحكم', icon: 'dashboard', end: true },
      { to: `${ROUTES.TRAFFIC}/rosters`, label: 'القوائم', icon: 'list_alt' },
      { to: `${ROUTES.TRAFFIC}/schedules`, label: 'مواعيد الامتحان', icon: 'event' },
      { to: `${ROUTES.TRAFFIC}/results`, label: 'إدخال النتائج', icon: 'assignment_turned_in' },
    ],
  },
}
