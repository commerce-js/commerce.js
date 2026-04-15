// ---------------------------------------------------------------------------
// Static geo reference data for /api/storefront/{countries,cities}
// ---------------------------------------------------------------------------
//
// Duplicated from packages/nuxt/src/runtime/server/data/ so the dashboard
// can serve these endpoints without a cross-package deep import. The
// source of truth stays in @commercejs/nuxt's data files — treat this
// file as a mirror and keep them in sync when the list changes.
// Long-term, these should migrate to @commercejs/types or a dedicated
// @commercejs/data package.
// ---------------------------------------------------------------------------

/** ISO 3166-1 alpha-2 → flag URL + alpha-3 code, for common GCC markets. */
export const countryMeta: Record<string, { flag: string, iso3: string }> = {
  BH: { flag: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Flag_of_Bahrain.svg', iso3: 'BHR' },
  KW: { flag: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Flag_of_Kuwait.svg', iso3: 'KWT' },
  OM: { flag: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Flag_of_Oman.svg', iso3: 'OMN' },
  QA: { flag: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Flag_of_Qatar.svg', iso3: 'QAT' },
  SA: { flag: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Flag_of_Saudi_Arabia.svg', iso3: 'SAU' },
  AE: { flag: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Flag_of_the_United_Arab_Emirates.svg', iso3: 'ARE' },
}

/** Curated city list per GCC country (ISO 3166-1 alpha-2). */
export const citiesByCountry: Record<string, string[]> = {
  BH: [
    'Al Budayyi\'', 'Al Hadd', 'Al Hamalah', 'Al Janabiyah', 'Al Markh',
    'Al Muharraq', 'Bani Jamrah', 'Barbar', 'Jurdab', 'Madinat Isa',
    'Madinat Hamad', 'Manama', 'Oil City', 'Sanabis', 'Sanad', 'Sitrah', 'Tubli',
  ],
  KW: [
    'Abraq Khaytan', 'Ad Dasmah', 'Ad Dawhah', 'Al Ahmadi', 'Al Farwaniyah',
    'Al Shamiya', 'Ar Rawdah', 'As Salimiyah', 'Ash Shuwaykh', 'Bayan',
    'Hawalli', 'Janub as Surrah', 'Kayfan', 'Kuwait City', 'Salwa',
  ],
  OM: [
    'Al Sohar', 'Muscat', 'Nizwa', 'Ruwi', 'Saham', 'Salalah', 'Samad',
  ],
  QA: [
    'Ad Dawhah', 'Al Ghuwayriyah', 'Al Jumayliyah', 'Al Khawr', 'Al Wakrah',
    'Ar Rayyan', 'Jarayan al Batinah', 'Madinat ash Shamal', 'Umm Said', 'Umm Salal',
  ],
  SA: [
    'Abha', 'Abqaiq', 'Al Bahah', 'Al Hufuf', 'Al Qatif', 'Buraidah',
    'Dammam', 'Dhahran', 'Hayil', 'Jeddah', 'Jizan', 'Jubail',
    'Khamis Mushait', 'Khobar', 'Khulays', 'Mecca', 'Medina', 'Najran',
    'Rabigh', 'Ras Tanura', 'Riyadh', 'Sabya', 'Safwa', 'Sakaka',
    'Sayhat', 'Tabuk', 'Yanbu',
  ],
  AE: [
    'Abu Dhabi', 'Al Ain', 'Al Khan', 'Ar Ruways', 'As Satwah',
    'Dayrah', 'Dubai', 'Fujairah', 'Ras al-Khaimah', 'Sharjah',
  ],
}
