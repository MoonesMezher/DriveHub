import { useQuery } from '@tanstack/react-query'
import {
  PageHeader,
  AsyncContent,
  ImageCard,
  SectionBlock,
  PageSection,
  Badge,
} from '@/components/ui'
import { licenseService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { PUBLIC_HERO_IMAGES } from '@/lib/constants/publicVisuals'
import { LICENSE_IMAGES } from '@/lib/constants/homeVisuals'

export const LicensesPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => unwrap(await licenseService.list()),
  })

  const licenses = Array.isArray(data) ? data : []

  return (
    <div dir="rtl" className="space-y-loose">
      <section className="relative overflow-hidden rounded-3xl shadow-card">
        <img
          src={PUBLIC_HERO_IMAGES.licenses}
          alt="أنواع الرخص"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/50 to-transparent" />
        <div className="relative px-6 py-12 md:px-10 md:py-16">
          <Badge variant="secondary" className="mb-4 bg-white/20 text-white backdrop-blur">
            فئات الرخص
          </Badge>
          <PageHeader
            title="أنواع الرخص"
            description="تعرف على فئات الرخص ومتطلباتها قبل التسجيل"
            className="!mb-0 [&_h1]:text-white [&_p]:text-white/90"
          />
        </div>
      </section>

      <PageSection>
        <SectionBlock
          title="استكشف الفئات"
          description="اضغط لعرض المتطلبات والأنواع الفرعية"
        >
          <AsyncContent
            isLoading={isLoading}
            error={error}
            isEmpty={!licenses.length}
            emptyIcon="badge"
            emptyTitle="لا توجد رخص متاحة"
            emptyDescription="لم يتم إعداد فئات الرخص بعد."
            skeleton
          >
            {() => (
              <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {licenses.map((license) => (
                  <ImageCard
                    key={license.code}
                    to={`/licenses/${license.code}`}
                    image={LICENSE_IMAGES[license.code] || LICENSE_IMAGES.default}
                    alt={license.name}
                    aspect="portrait"
                    badge={`${license.minAge}+ سنة`}
                    title={license.name}
                    subtitle={license.briefDesc || license.fullDesc || license.code}
                    footer={
                      license.subTypes?.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {license.subTypes.map((sub) => (
                            <Badge key={sub} variant="default">
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      ) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </AsyncContent>
        </SectionBlock>
      </PageSection>
    </div>
  )
}
