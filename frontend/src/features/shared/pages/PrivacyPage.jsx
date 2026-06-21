import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, AsyncContent, PageSection, Icon } from '@/components/ui'
import { settingsService } from '@/lib/services'
import { unwrap } from '@/lib/helpers/api'
import { cn } from '@/lib/cn'

const extractSections = (content) => {
  if (!content) return []
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('## '))
    .map((line, i) => ({
      id: `privacy-section-${i}`,
      title: line.slice(3),
    }))
}

const PrivacyContent = ({ content }) => {
  if (!content) return null

  const lines = content.split('\n')
  let sectionIndex = -1

  return (
    <div className="space-y-3 text-body-lg leading-relaxed text-on-surface">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <br key={i} />
        if (trimmed.startsWith('## ')) {
          sectionIndex += 1
          return (
            <h2
              key={i}
              id={`privacy-section-${sectionIndex}`}
              className="scroll-mt-24 pt-6 text-headline-md font-semibold text-primary first:pt-0"
            >
              {trimmed.slice(3)}
            </h2>
          )
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={i} className="pt-4 text-headline-sm font-semibold text-on-surface">
              {trimmed.slice(4)}
            </h3>
          )
        }
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={i}
              className="border-s-4 border-secondary-container ps-4 text-body-md italic text-on-surface-variant"
            >
              {trimmed.slice(2)}
            </blockquote>
          )
        }
        const html = trimmed
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
        return (
          <p
            key={i}
            className="text-body-md text-on-surface-variant"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      })}
    </div>
  )
}

export const PrivacyPage = () => {
  const privacyQuery = useQuery({
    queryKey: ['settings', 'privacy'],
    queryFn: async () => unwrap(await settingsService.getPrivacy()),
  })

  const sections = useMemo(
    () => extractSections(privacyQuery.data?.content),
    [privacyQuery.data?.content],
  )

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div dir="rtl" className="space-y-loose">
      <PageHeader
        title="سياسة الخصوصية"
        description="كيف نجمع ونستخدم ونحمي بياناتك على منصة DriveHub"
      />

      <div className="grid gap-loose lg:grid-cols-[240px_1fr]">
        {sections.length > 0 && (
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <PageSection variant="contained" className="!p-comfortable">
              <p className="mb-3 flex items-center gap-2 text-label-md font-semibold text-primary">
                <Icon name="list" size={18} />
                المحتويات
              </p>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      'block w-full rounded-lg px-3 py-2 text-start text-body-md',
                      'text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary',
                    )}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </PageSection>
          </aside>
        )}

        <PageSection variant="elevated">
          <AsyncContent
            isLoading={privacyQuery.isLoading}
            error={privacyQuery.error}
            skeleton
          >
            {() => <PrivacyContent content={privacyQuery.data?.content} />}
          </AsyncContent>
        </PageSection>
      </div>
    </div>
  )
}
