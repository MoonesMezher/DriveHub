export {
  HOME_IMAGES,
  LICENSE_IMAGES,
  JOURNEY_STEPS,
  VISUAL_BENEFITS,
  TESTIMONIALS,
  TRUST_BADGES,
} from './homeVisuals'

const hero = (id) =>
  `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`

export const PUBLIC_HERO_IMAGES = {
  licenses: hero('1568605117036-5fe5e7bab0b7'),
  schools: hero('1503676260728-1c00da094a0b'),
  requirements: hero('1454165804606-c3d57bc86b40'),
  sample: hero('1516321318423-f06f85e504b3'),
  faq: hero('1522071820081-009f0129c71c'),
}
