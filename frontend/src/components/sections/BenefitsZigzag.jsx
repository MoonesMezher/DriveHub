import { Icon, SafeImage, SectionBlock } from '@/components/ui'
import { VISUAL_BENEFITS } from '@/lib/constants/homeVisuals'

export const BenefitsZigzag = () => (
  <div className="space-y-loose">
    <SectionBlock
      title="لماذا DriveHub؟"
      description="سريع · واضح · معتمد"
      align="center"
    />
    {VISUAL_BENEFITS.map((item, i) => (
      <div
        key={item.title}
        className={`grid items-center gap-loose overflow-hidden rounded-3xl bg-surface-container-lowest shadow-card lg:grid-cols-2 ${
          i % 2 === 1 ? 'lg:[direction:ltr]' : ''
        }`}
      >
        <div className={`relative min-h-[240px] lg:min-h-[320px] ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
          <SafeImage src={item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className={`flex flex-col justify-center p-8 lg:p-12 ${i % 2 === 1 ? 'lg:order-1 lg:[direction:rtl]' : ''}`}>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
            <Icon name={item.icon} size={32} />
          </div>
          <h3 className="text-headline-md text-primary">{item.title}</h3>
          <p className="mt-2 text-headline-sm text-secondary">{item.subtitle}</p>
        </div>
      </div>
    ))}
  </div>
)
