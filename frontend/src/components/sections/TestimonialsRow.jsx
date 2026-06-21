import { Icon } from '@/components/ui'
import { TESTIMONIALS } from '@/lib/constants/homeVisuals'
import { SectionBlock } from '@/components/ui'

export const TestimonialsRow = () => (
  <SectionBlock
    title="ماذا يقول المتعلّمون"
    actions={(
      <div className="flex items-center gap-1 text-secondary">
        {[1, 2, 3, 4, 5].map((n) => (
          <Icon key={n} name="star" size={20} className="rating-star active" />
        ))}
      </div>
    )}
  >
    <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {TESTIMONIALS.map((t) => (
        <div
          key={t.name}
          className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-comfortable shadow-sm"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-label-md font-bold text-on-primary-container">
              {t.initial}
            </div>
            <span className="text-label-md font-semibold text-on-surface">{t.name}</span>
          </div>
          <p className="text-body-md text-on-surface-variant">&ldquo;{t.text}&rdquo;</p>
        </div>
      ))}
    </div>
  </SectionBlock>
)
