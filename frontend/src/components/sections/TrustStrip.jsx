import { Icon } from '@/components/ui'
import { TRUST_BADGES } from '@/lib/constants/homeVisuals'

export const TrustStrip = () => (
  <section className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest py-4">
    <div className="flex animate-marquee gap-8 whitespace-nowrap px-4">
      {[...TRUST_BADGES, ...TRUST_BADGES].map((badge, i) => (
        <span
          key={`${badge.label}-${i}`}
          className="inline-flex shrink-0 items-center gap-2 text-label-md font-medium text-on-surface"
        >
          <Icon name={badge.icon} size={22} className="text-primary" />
          {badge.label}
        </span>
      ))}
    </div>
  </section>
)
