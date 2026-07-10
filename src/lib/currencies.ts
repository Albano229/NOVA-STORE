export interface Currency {
  code: string
  symbol: string
  name: string
  country: string
  region: string
  format: (amount: number) => string
}

export const CURRENCIES: Record<string, Currency> = {
  XOF: { code: "XOF", symbol: "FCFA", name: "Franc CFA", country: "Bénin", region: "UEMOA", format: (a) => `${a.toLocaleString("fr-FR")} FCFA` },
  XAF: { code: "XAF", symbol: "FCFA", name: "Franc CFA", country: "Cameroun", region: "CEMAC", format: (a) => `${a.toLocaleString("fr-FR")} FCFA` },
  NGN: { code: "NGN", symbol: "₦", name: "Naira", country: "Nigeria", region: "Afrique", format: (a) => `₦${a.toLocaleString("en-NG")}` },
  GHS: { code: "GHS", symbol: "GH₵", name: "Cedi", country: "Ghana", region: "Afrique", format: (a) => `GH₵${a.toFixed(2)}` },
  KES: { code: "KES", symbol: "KSh", name: "Shilling", country: "Kenya", region: "Afrique", format: (a) => `KSh${a.toLocaleString("en-KE")}` },
  ZAR: { code: "ZAR", symbol: "R", name: "Rand", country: "Afrique du Sud", region: "Afrique", format: (a) => `R${a.toFixed(2)}` },
  EUR: { code: "EUR", symbol: "€", name: "Euro", country: "France", region: "Europe", format: (a) => `${a.toFixed(2)} €` },
  USD: { code: "USD", symbol: "$", name: "Dollar", country: "États-Unis", region: "Amérique", format: (a) => `$${a.toFixed(2)}` },
  GBP: { code: "GBP", symbol: "£", name: "Livre", country: "Royaume-Uni", region: "Europe", format: (a) => `£${a.toFixed(2)}` },
  CAD: { code: "CAD", symbol: "CA$", name: "Dollar canadien", country: "Canada", region: "Amérique", format: (a) => `CA$${a.toFixed(2)}` },
  MAD: { code: "MAD", symbol: "MAD", name: "Dirham", country: "Maroc", region: "Afrique", format: (a) => `${a.toFixed(2)} MAD` },
  CDF: { code: "CDF", symbol: "FC", name: "Franc congolais", country: "RDC", region: "Afrique", format: (a) => `${a.toLocaleString("fr-FR")} FC` },
}

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  BJ: "XOF", BF: "XOF", CI: "XOF", ML: "XOF", NE: "XOF", SN: "XOF", TG: "XOF", GW: "XOF",
  CM: "XAF", CG: "XAF", GA: "XAF", TD: "XAF", CF: "XAF", GQ: "XAF",
  NG: "NGN", GH: "GHS", KE: "KES", ZA: "ZAR", MA: "MAD", CD: "CDF",
  FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", PT: "EUR", NL: "EUR", BE: "EUR",
  US: "USD", CA: "CAD", GB: "GBP",
}

export const PHONE_CODES: Array<{ country: string; code: string; dial: string; format: string }> = [
  { country: "Bénin", code: "BJ", dial: "+229", format: "XX XX XX XX" },
  { country: "Togo", code: "TG", dial: "+228", format: "XX XX XX XX" },
  { country: "Nigeria", code: "NG", dial: "+234", format: "XXX XXX XXXX" },
  { country: "Cameroun", code: "CM", dial: "+237", format: "XXX XXX XXX" },
  { country: "Côte d'Ivoire", code: "CI", dial: "+225", format: "XX XX XX XX XX" },
  { country: "Sénégal", code: "SN", dial: "+221", format: "XX XXX XX XX" },
  { country: "Ghana", code: "GH", dial: "+233", format: "XXX XXX XXXX" },
  { country: "Kenya", code: "KE", dial: "+254", format: "XXX XXX XXX" },
  { country: "RDC", code: "CD", dial: "+243", format: "XXX XXX XXXX" },
  { country: "Maroc", code: "MA", dial: "+212", format: "XXX XXX XXX" },
  { country: "France", code: "FR", dial: "+33", format: "X XX XX XX XX" },
  { country: "Belgique", code: "BE", dial: "+32", format: "XXX XX XX XX" },
  { country: "Canada", code: "CA", dial: "+1", format: "XXX XXX XXXX" },
  { country: "États-Unis", code: "US", dial: "+1", format: "XXX XXX XXXX" },
  { country: "Royaume-Uni", code: "GB", dial: "+44", format: "XXXX XXXXXX" },
  { country: "Allemagne", code: "DE", dial: "+49", format: "XXXX XXXXXXX" },
]

export const AFRICAN_REGIONS = [
  "UEMOA (Bénin, Sénégal, Côte d'Ivoire...)",
  "CEMAC (Cameroun, Gabon, Congo...)",
  "Afrique de l'Est (Kenya, Tanzanie...)",
  "Afrique australe (Afrique du Sud, Zimbabwe...)",
  "Maghreb (Maroc, Tunisie, Algérie...)",
]

export function getCountryFields(countryCode: string): { postalLabel: string; postalPlaceholder: string; cityLabel: string } {
  const europeanCountries = ["FR", "DE", "ES", "IT", "PT", "NL", "BE", "GB", "CA", "US"]
  const isEuropeanOrAmerican = europeanCountries.includes(countryCode)

  return {
    postalLabel: isEuropeanOrAmerican ? "Code postal" : "Code postal / Quartier",
    postalPlaceholder: isEuropeanOrAmerican ? "75001" : "Quartier / Code postal",
    cityLabel: isEuropeanOrAmerican ? "Ville" : "Ville / Quartier",
  }
}
