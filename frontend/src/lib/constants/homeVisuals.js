/**
 * صور المنصة — روابط Unsplash مُختبرة (HTTP 200)
 * استخدم دائماً من هذا الملف بدل روابط مباشرة في الصفحات
 */
const img = (id, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`

export const HOME_IMAGES = {
  hero: img('1449965408869-eaa3f722e40d', 1400),
  theory: img('1516321318423-f06f85e504b3'),
  practice: img('1503376780353-7e6692767b70'),
  exam: img('1454165804606-c3d57bc86b40'),
  license: img('1568605117036-5fe5e7bab0b7'),
  school: img('1503676260728-1c00da094a0b'),
  mobile: img('1511707171634-5f897ff02aa9'),
  cta: img('1492144534655-ae79c964c9d7', 1600),
  medical: img('1576091160399-112ba8d25d1d', 600),
  portrait: img('1507003211169-0a1dd7228f2d', 600),
  register: img('1573496359142-b8d87734a5a2', 600),
}

export const LICENSE_IMAGES = {
  B: img('1502877338535-766e1452684a', 600),
  C: img('1549317661-bd32c8ce0db2', 600),
  D1: img('1619642751034-765dfdf7c58e', 600),
  D2: img('1619642751034-765dfdf7c58e', 600),
  A: img('1558618666-fcd25c85cd64', 600),
  H: img('1625246333195-78d9c38ad449', 600),
  W: img('1502877338535-766e1452684a', 600),
  default: HOME_IMAGES.license,
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
  { icon: 'lock', label: 'دفع آمن' },
]
