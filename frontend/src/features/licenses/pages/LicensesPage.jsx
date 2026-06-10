import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Card, AsyncContent, Badge, Icon } from '@/components/ui'
import { licenseService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'

export const LicensesPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['licenses'],
    queryFn: async () => unwrap(await licenseService.list()),
  })

  const licenses = Array.isArray(data) ? data : []

  return (
    <div dir="rtl">
      <PageHeader
        title="أنواع الرخص"
        description="تعرف على فئات الرخص ومتطلباتها قبل التسجيل — بدون أسعار للزائر"
      />

      <AsyncContent
        isLoading={isLoading}
        error={error}
        isEmpty={!licenses.length}
        emptyIcon="badge"
        emptyTitle="لا توجد رخص متاحة"
        emptyDescription="لم يتم إعداد فئات الرخص بعد."
      >
        {() => (
<div className="bento-grid">
          {licenses.map((license) => (
            <Link
              key={license.code}
              to={`/licenses/${license.code}`}
              className="col-span-12 md:col-span-4"
            >
              <Card hoverable className="h-full">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
                    <span className="text-headline-sm font-bold">{license.code}</span>
                  </div>
                  <Badge variant="primary">{license.minAge}+ سنة</Badge>
                </div>
                <h3 className="text-headline-sm text-primary">{license.name}</h3>
                <p className="mt-2 line-clamp-3 text-body-md text-on-surface-variant">
                  {license.briefDesc || license.fullDesc || 'اضغط لعرض التفاصيل والمتطلبات'}
                </p>
                {license.subTypes?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {license.subTypes.map((sub) => (
                      <Badge key={sub} variant="default">
                        {sub}
                      </Badge>
                    ))}
                  </div>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-label-md font-medium text-primary">
                  عرض التفاصيل
                  <Icon name="arrow_back" size={18} />
                </span>
              </Card>
            </Link>
          ))}
        </div>

        )}
      </AsyncContent>
    </div>
  )
}
