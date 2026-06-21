import { HomeHero } from '@/features/home/components/HomeHero'
import {
  TrustStrip,
  TestimonialsRow,
  JourneySteps,
  PopularLicenses,
  BenefitsZigzag,
  NearbySchoolsVisual,
  HomeFaqPreview,
  HomeFinalCta,
} from '@/features/home/components/HomeSections'

export const HomePage = () => (
  <div className="page-container space-y-loose py-8">
    <HomeHero />
    <TrustStrip />
    <JourneySteps />
    <PopularLicenses />
    <BenefitsZigzag />
    <NearbySchoolsVisual />
    <TestimonialsRow />
    <HomeFaqPreview />
    <HomeFinalCta />
  </div>
)
