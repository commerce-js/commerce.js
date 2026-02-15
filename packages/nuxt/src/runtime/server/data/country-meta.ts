/**
 * Static country metadata: flag URLs and ISO3 codes.
 * Keyed by ISO 3166-1 alpha-2 code.
 * This data is embedded so we don't need external API calls for flags.
 */
export const countryMeta: Record<string, { flag: string; iso3: string }> = {
  BH: { flag: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Flag_of_Bahrain.svg', iso3: 'BHR' },
  KW: { flag: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Flag_of_Kuwait.svg', iso3: 'KWT' },
  OM: { flag: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Flag_of_Oman.svg', iso3: 'OMN' },
  QA: { flag: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Flag_of_Qatar.svg', iso3: 'QAT' },
  SA: { flag: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Flag_of_Saudi_Arabia.svg', iso3: 'SAU' },
  AE: { flag: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Flag_of_the_United_Arab_Emirates.svg', iso3: 'ARE' },
}
