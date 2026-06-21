import { useState } from 'react'
import { PageHeader, Badge } from '@/components/ui'
import { FaqAccordion, CtaBanner } from '@/components/sections'
import { ROUTES } from '@/lib/constants/routes'
import { PUBLIC_HERO_IMAGES } from '@/lib/constants/publicVisuals'

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

export const FaqPage = () => {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div dir="rtl" className="space-y-loose">
      <section className="relative overflow-hidden rounded-3xl shadow-card">
        <img
          src={PUBLIC_HERO_IMAGES.faq}
          alt="الأسئلة الشائعة"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/50 to-transparent" />
        <div className="relative px-6 py-12 md:px-10 md:py-16">
          <Badge variant="secondary" className="mb-4 bg-white/20 text-white backdrop-blur">
            مساعدة
          </Badge>
          <PageHeader
            title="الأسئلة الشائعة"
            description="إجابات سريعة عن التسجيل والرخص والمدارس"
            className="!mb-0 [&_h1]:text-white [&_p]:text-white/90"
          />
        </div>
      </section>

      <FaqAccordion
        items={faqItems}
        title="كل الأسئلة"
        showMoreLink={false}
        searchable
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <CtaBanner
        title="لم تجد إجابتك؟"
        description="راجع متطلبات التسجيل أو قدّم طلب انضمام لمدرستك"
        primaryAction={{ label: 'متطلبات التسجيل', to: ROUTES.REQUIREMENTS }}
        secondaryAction={{ label: 'أضف مدرستك', to: ROUTES.ADD_SCHOOL }}
      />
    </div>
  )
}
