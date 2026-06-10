import { Link } from 'react-router-dom'
import { PageHeader, Card, Button, Icon, Badge } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

const requirements = [
  {
    icon: 'cake',
    title: 'السن القانوني',
    desc: 'يجب بلوغ الحد الأدنى للعمر حسب فئة الرخصة (18 سنة للخصوصي، 21 للعمومي).',
  },
  {
    icon: 'badge',
    title: 'الهوية الوطنية',
    desc: 'بطاقة هوية سارية أو جواز سفر مع إثبات الإقامة للمقيمين.',
  },
  {
    icon: 'health_and_safety',
    title: 'الفحص الطبي',
    desc: 'شهادة لياقة طبية من جهة معتمدة تثبت قدرتك على القيادة.',
  },
  {
    icon: 'photo_camera',
    title: 'صور شخصية',
    desc: 'عدد 4 صور شخصية بخلفية بيضاء حسب مواصفات إدارة المرور.',
  },
  {
    icon: 'school',
    title: 'التسجيل في مدرسة',
    desc: 'اختيار مدرسة معتمدة ودفع رسوم المنصة والدورة عبر DriveHub.',
  },
  {
    icon: 'menu_book',
    title: 'اجتياز الامتحانات',
    desc: 'نجاح في الامتحان النظري ثم العملي وفق جدول المرور.',
  },
]

const steps = [
  'إنشاء حساب على DriveHub',
  'استكشاف الرخص واختيار الفئة المناسبة',
  'البحث عن مدرسة قريبة والتقديم',
  'دفع الرسوم وانتظار قبول المدرسة',
  'بدء الدروس النظرية والعملية',
  'تقديم امتحان المرور',
]

export const RequirementsPage = () => (
  <div dir="rtl">
    <PageHeader
      title="متطلبات التسجيل"
      description="كل ما تحتاجه قبل التقديم على رخصة القيادة"
      actions={
        <Link to={ROUTES.REGISTER}>
          <Button>إنشاء حساب</Button>
        </Link>
      }
    />

    <div className="bento-grid mb-loose">
      {requirements.map((item) => (
        <Card key={item.title} className="col-span-12 md:col-span-4">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
            <Icon name={item.icon} size={24} />
          </div>
          <h3 className="text-headline-sm text-primary">{item.title}</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">{item.desc}</p>
        </Card>
      ))}
    </div>

    <Card title="خطوات التسجيل" description="من الحساب إلى الرخصة">
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={step} className="flex items-start gap-4">
            <Badge variant="primary" className="mt-0.5 shrink-0">
              {index + 1}
            </Badge>
            <span className="text-body-md text-on-surface">{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-loose flex flex-wrap gap-3">
        <Link to={ROUTES.LICENSES}>
          <Button variant="outline">استكشاف الرخص</Button>
        </Link>
        <Link to={ROUTES.SCHOOLS_NEARBY}>
          <Button variant="secondary">البحث عن مدارس</Button>
        </Link>
      </div>
    </Card>
  </div>
)
