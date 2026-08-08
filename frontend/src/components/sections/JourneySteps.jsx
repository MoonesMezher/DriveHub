import { Icon, SafeImage } from '@/components/ui'
import { JOURNEY_STEPS } from '@/lib/constants/homeVisuals'
import { SectionBlock } from '@/components/ui'

export const JourneySteps = ({
  title = 'رحلتك في 4 خطوات',
  description = 'من التسجيل إلى الرخصة — بصرياً',
  steps,
}) => {
  const items = Array.isArray(steps) && steps.length > 0 ? steps : JOURNEY_STEPS

  return (
    <SectionBlock title={title} description={description} align="center">
      <div className="grid gap-comfortable sm:grid-cols-2 lg:grid-cols-4">
        {items.map((step, i) => (
          <div key={step.id || step.label} className="group relative overflow-hidden rounded-2xl shadow-card">
            <SafeImage
              src={step.image}
              alt={step.label}
              className="aspect-[4/5] w-full object-cover transition-transform duration-slow group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-0 start-0 end-0 p-5 text-white">
              <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-label-md font-bold">
                {i + 1}
              </span>
              <div className="flex items-center gap-2">
                <Icon name={step.icon || 'check_circle'} size={24} />
                <h3 className="text-headline-sm font-bold">{step.label}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionBlock>
  )
}
