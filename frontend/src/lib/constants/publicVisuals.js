export {
  HOME_IMAGES,
  LICENSE_IMAGES,
  JOURNEY_STEPS,
  VISUAL_BENEFITS,
  TESTIMONIALS,
  TRUST_BADGES,
} from './homeVisuals'

const hero = (file) => `/images/driving/${file}`

export const PUBLIC_HERO_IMAGES = {
  licenses: hero('hero-licenses.jpg'),
  schools: hero('hero-schools.jpg'),
  requirements: hero('hero-requirements.jpg'),
  sample: hero('hero-sample.jpg'),
  faq: hero('hero-faq.jpg'),
}
