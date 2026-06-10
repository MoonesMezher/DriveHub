import { Link } from 'react-router-dom'
import { PageHeader, Card, Accordion, Button } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

const faqItems = [
  {
    id: 'register',
    title: 'كيف أنشئ حساباً على DriveHub؟',
    content:
      'اضغط «تسجيل جديد» من الصفحة الرئيسية، أدخل بياناتك الأساسية، وستتمكن فوراً من استكشاف الرخص والعينة المجانية. للتقديم على المدارس تحتاج حساباً مسجلاً.',
  },
  {
    id: 'license',
    title: 'ما الفرق بين فئات الرخص؟',
    content:
      'كل فئة (مثل B للخصوصي، C للعمومي) لها سن أدنى ومتطلبات مختلفة. راجع صفحة «أنواع الرخص» لمعرفة التفاصيل والأنواع الفرعية دون عرض الأسعار للزائر.',
  },
  {
    id: 'school',
    title: 'كيف أختار مدرسة قريبة؟',
    content:
      'من صفحة «أقرب المدارس» اسمح للمتصفح بتحديد موقعك. نرتّب المدارس المعتمدة حسب المسافة ويمكنك التصفية حسب فئة الرخصة أو توفر مدربات إناث.',
  },
  {
    id: 'enroll',
    title: 'ماذا يحدث بعد تقديم طلب الاشتراك؟',
    content:
      'يمر طلبك بمراحل: تقديم، مراجعة المدرسة، ثم الدفع عند القبول. يمكنك متابعة الحالة من صفحة «طلب اشتراك» في لوحتك. طلب معلّق واحد فقط في كل وقت.',
  },
  {
    id: 'payment',
    title: 'متى أدفع رسوم الدورة؟',
    content:
      'بعد قبول المدرسة لطلبك ينتقل الطلب إلى «بانتظار الدفع». ادفع خلال المهلة المحددة عبر المنصة لتفعيل مقعدك في الدورة.',
  },
  {
    id: 'sample',
    title: 'هل المحتوى النظري مجاني؟',
    content:
      'نوفر عينة مجانية من الأسئلة للزائر. المحتوى الكامل وبنك الأسئلة والمحاكاة متاحان بعد التسجيل والاشتراك في دورة.',
  },
  {
    id: 'add-school',
    title: 'كيف تسجّل مدرستي على المنصة؟',
    content:
      'من صفحة «أضف مدرستك» قدّم طلب انضمام مع بيانات المدرسة والرخص المدعومة. يراجع فريق DriveHub الطلب ويتواصل معك.',
  },
]

export const FaqPage = () => (
  <div dir="rtl">
    <PageHeader
      title="الأسئلة الشائعة"
      description="إجابات سريعة عن التسجيل والرخص والمدارس"
    />

    <Card padding="lg">
      <Accordion items={faqItems} />
    </Card>

    <Card className="mt-loose" variant="tinted">
      <p className="text-body-lg">لم تجد إجابتك؟</p>
      <p className="mt-2 text-body-md opacity-90">
        تواصل معنا أو راجع متطلبات التسجيل للخطوات التفصيلية.
      </p>
      <div className="mt-comfortable flex flex-wrap gap-3">
        <Link to={ROUTES.REQUIREMENTS}>
          <Button variant="secondary">متطلبات التسجيل</Button>
        </Link>
        <Link to={ROUTES.ADD_SCHOOL}>
          <Button variant="outline" className="border-white/40 text-inherit hover:bg-white/10">
            أضف مدرستك
          </Button>
        </Link>
      </div>
    </Card>
  </div>
)
