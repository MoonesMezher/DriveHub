import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, Card, Badge, Tabs } from '@/components/ui'
import { studentService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { truncate } from '@/lib/helpers/format'
import { SHARED_SECTION_LABELS } from '@/lib/constants/lessonLabels'

const TABS = [
  { id: 'theory', label: 'النظري' },
  { id: 'shared', label: 'مشترك' },
  { id: 'specific', label: 'مخصص' },
]

const fetchers = {
  theory: () => studentService.listTheory(),
  shared: () => studentService.listShared(),
  specific: () => studentService.listSpecific(),
}

export const StudentTheoryPage = () => {
  const [activeTab, setActiveTab] = useState('theory')

  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'theory', activeTab],
    queryFn: async () => unwrap(await fetchers[activeTab]()),
  })

  const items = data?.items ?? []

  return (
    <div dir="rtl">
      <PageHeader
        title="التعلم النظري"
        description="محتوى نظري، مشترك، ومخصص حسب فئتك"
      />

      <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} className="mb-loose" />

      <AsyncContent
        isLoading={isLoading}
        error={error}
        isEmpty={!items.length}
        emptyIcon="menu_book"
        emptyTitle="لا يوجد محتوى"
        emptyDescription="سيظهر المحتوى التعليمي هنا عند توفره"
      >
        {() => (
<div className="space-y-comfortable">
          {items.map((item) => (
            <Card key={item._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-headline-sm text-on-surface">{item.title}</h3>
                  <p className="mt-2 text-body-md text-on-surface-variant">
                    {truncate(item.body, 200)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.phase != null && (
                    <Badge variant="secondary">المرحلة {item.phase}</Badge>
                  )}
                  {item.section && (
                    <Badge variant="primary">
                      {SHARED_SECTION_LABELS[item.section] ?? item.section}
                    </Badge>
                  )}
                  {item.categoryCode && (
                    <Badge variant="default">فئة {item.categoryCode}</Badge>
                  )}
                  {item.interactiveQuestions?.length > 0 && (
                    <Badge variant="success">
                      {item.interactiveQuestions.length} سؤال
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        )}
      </AsyncContent>
    </div>
  )
}
