import { Link } from 'react-router-dom'
import { Accordion, Button, PageSection, SectionBlock } from '@/components/ui'
import { ROUTES } from '@/lib/constants/routes'

export const FaqAccordion = ({
  items,
  title = 'أسئلة شائعة',
  showMoreLink = true,
  searchable = false,
  searchQuery = '',
  onSearchChange,
}) => {
  const filtered = searchable && searchQuery
    ? items.filter((item) => {
        const haystack = [
          item.title,
          item.content,
          item.linkLabel,
          item.linkUrl,
        ].filter(Boolean).join(' ')
        return haystack.includes(searchQuery)
      })
    : items

  return (
    <PageSection variant="contained">
      <SectionBlock
        title={title}
        actions={showMoreLink ? (
          <Link to={ROUTES.FAQ}>
            <Button variant="ghost" size="sm">المزيد</Button>
          </Link>
        ) : null}
      >
        {searchable && onSearchChange && (
          <input
            type="search"
            placeholder="ابحث في الأسئلة..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="mb-comfortable h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        )}
        <Accordion items={filtered} />
      </SectionBlock>
    </PageSection>
  )
}
