import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/components/ui'
import { TRUST_BADGES } from '@/lib/constants/homeVisuals'

const INTERVAL_MS = 3500
const TRANSITION_MS = 600

const getItemsPerView = (width) => {
  if (width >= 1280) return 4
  if (width >= 768) return 3
  return 2
}

const BadgeItem = ({ badge }) => (
  <div className="flex shrink-0 items-center justify-center gap-2 px-3 py-1">
    <Icon name={badge.icon} size={22} className="shrink-0 text-primary" />
    <span className="whitespace-nowrap text-label-md font-medium text-on-surface">
      {badge.label}
    </span>
  </div>
)

export const TrustStrip = () => {
  const [index, setIndex] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [itemsPerView, setItemsPerView] = useState(3)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [paused, setPaused] = useState(false)
  const [isRtl, setIsRtl] = useState(true)
  const indexRef = useRef(0)

  const visibleCount = Math.min(itemsPerView, TRUST_BADGES.length)
  const slideCount = TRUST_BADGES.length

  const trackItems = useMemo(() => {
    const clones = TRUST_BADGES.slice(0, visibleCount)
    return [...TRUST_BADGES, ...clones]
  }, [visibleCount])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    setIsRtl(document.documentElement.dir === 'rtl')

    const updateItemsPerView = () => {
      setItemsPerView(getItemsPerView(window.innerWidth))
    }

    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [])

  useEffect(() => {
    setIndex(0)
    indexRef.current = 0
  }, [visibleCount])

  useEffect(() => {
    indexRef.current = index
  }, [index])

  const handleTransitionEnd = useCallback(() => {
    if (indexRef.current >= slideCount) {
      setIsTransitioning(false)
      setIndex(0)
      indexRef.current = 0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsTransitioning(true))
      })
    }
  }, [slideCount])

  useEffect(() => {
    if (reduceMotion || paused || slideCount <= 1) return undefined

    const id = window.setInterval(() => {
      setIndex((current) => current + 1)
    }, INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [reduceMotion, paused, slideCount, visibleCount])

  if (reduceMotion) {
    return (
      <section
        className="rounded-2xl border border-outline-variant bg-surface-container-lowest py-4"
        aria-label="مميزات المنصة"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4">
          {TRUST_BADGES.map((badge) => (
            <BadgeItem key={badge.label} badge={badge} />
          ))}
        </div>
      </section>
    )
  }

  const trackWidthFactor = trackItems.length / visibleCount
  const itemWidthPercent = 100 / trackItems.length
  const translatePercent = (index / trackItems.length) * 100
  const transform = isRtl
    ? `translateX(${translatePercent}%)`
    : `translateX(-${translatePercent}%)`

  const activeDot = index % slideCount

  return (
    <section
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest py-4"
      aria-live="polite"
      aria-label="مميزات المنصة"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false)
        }
      }}
    >
      <div className="overflow-hidden px-2">
        <div
          className="flex"
          style={{
            width: `${trackWidthFactor * 100}%`,
            transform,
            transition: isTransitioning
              ? `transform ${TRANSITION_MS}ms ease-in-out`
              : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {trackItems.map((badge, i) => (
            <div
              key={`${badge.label}-${i}`}
              className="flex shrink-0 items-center justify-center"
              style={{ width: `${itemWidthPercent}%` }}
            >
              <BadgeItem badge={badge} />
            </div>
          ))}
        </div>
      </div>

      {slideCount > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {TRUST_BADGES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeDot ? 'w-5 bg-primary' : 'w-1.5 bg-outline-variant/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
