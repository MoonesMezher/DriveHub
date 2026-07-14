/**
 * صور المنصة — أصول محلية في public/images/driving
 * استخدم دائماً من هذا الملف بدل روابط مباشرة في الصفحات
 */
const driving = (file) => `/images/driving/${file}`

export const HOME_IMAGES = {
  hero: driving('hero.jpg'),
  theory: driving('theory.jpg'),
  practice: driving('practice.jpg'),
  exam: driving('exam.jpg'),
  license: driving('license.jpg'),
  school: driving('school.jpg'),
  mobile: driving('mobile.jpg'),
  cta: driving('cta.jpg'),
  medical: driving('medical.jpg'),
  portrait: driving('register.jpg'),
  register: driving('register.jpg'),
}

export const LICENSE_IMAGES = {
  B: driving('license-b.jpg'),
  C: driving('license-c.jpg'),
  D1: driving('license-d.jpg'),
  D2: driving('license-d.jpg'),
  A: driving('license-a.jpg'),
  H: driving('license-h.jpg'),
  W: driving('license-b.jpg'),
  default: driving('license.jpg'),
}

export const JOURNEY_STEPS = [
  {
    icon: 'person_add',
    label: 'سجّل',
    image: HOME_IMAGES.register,
  },
  {
    icon: 'menu_book',
    label: 'تعلّم نظري',
    image: HOME_IMAGES.theory,
  },
  {
    icon: 'directions_car',
    label: 'دروس عملية',
    image: HOME_IMAGES.practice,
  },
  {
    icon: 'badge',
    label: 'رخصة',
    image: HOME_IMAGES.license,
  },
]

export const VISUAL_BENEFITS = [
  {
    title: 'تعلّم من أي جهاز',
    subtitle: 'هاتف · لابتوب · تابلت',
    image: HOME_IMAGES.mobile,
    icon: 'smartphone',
  },
  {
    title: 'مدارس معتمدة قريبة',
    subtitle: 'خريطة · مسافة · تقييمات',
    image: HOME_IMAGES.school,
    icon: 'location_on',
  },
  {
    title: 'امتحان مرور منظم',
    subtitle: 'مواعيد · نتائج · متابعة',
    image: HOME_IMAGES.exam,
    icon: 'fact_check',
  },
]

export const TESTIMONIALS = [
  { name: 'أحمد ك.', text: 'فهمت كل خطوات الرخصة من أول نظرة على المنصة', initial: 'أ' },
  { name: 'سارة م.', text: 'اختبار تجريبي ساعدني قبل امتحان المرور', initial: 'س' },
  { name: 'محمد ع.', text: 'لقيت مدرسة قريبة واشتركت خلال دقائق', initial: 'م' },
  { name: 'ليلى ح.', text: 'واجهة واضحة حتى بدون قراءة طويلة', initial: 'ل' },
  { name: 'كريم د.', text: 'متابعة طلب الاشتراك والدفع في مكان واحد', initial: 'ك' },
]

export const TRUST_BADGES = [
  { icon: 'verified', label: 'معتمد من المرور' },
  { icon: 'school', label: 'مدارس موثّقة' },
  { icon: 'smartphone', label: '100% عبر الجوال' },
  { icon: 'account_balance_wallet', label: 'دفع من رصيد المنصة' },
]
