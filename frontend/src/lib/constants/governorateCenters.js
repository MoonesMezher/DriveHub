/** مراكز تقريبية للمحافظات السورية — للبحث عند تعذّر GPS */
export const GOVERNORATE_CENTERS = {
  'دمشق': { lat: 33.5138, lng: 36.2765 },
  'ريف دمشق': { lat: 33.513, lng: 36.292 },
  'حلب': { lat: 36.2021, lng: 37.1343 },
  'حمص': { lat: 34.7324, lng: 36.7138 },
  'حماة': { lat: 35.1318, lng: 36.7578 },
  'اللاذقية': { lat: 35.5311, lng: 35.7908 },
  'طرطوس': { lat: 34.889, lng: 35.8866 },
  'إدلب': { lat: 35.9306, lng: 36.6339 },
  'الرقة': { lat: 35.9594, lng: 39.0023 },
  'الحسكة': { lat: 36.5073, lng: 40.7477 },
  'درعا': { lat: 32.6189, lng: 36.1021 },
  'السويداء': { lat: 32.7094, lng: 36.5745 },
  'القنيطرة': { lat: 33.126, lng: 35.8245 },
}

export const getGovernorateCoords = (governorate) =>
  GOVERNORATE_CENTERS[governorate] || GOVERNORATE_CENTERS['دمشق']
