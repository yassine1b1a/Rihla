import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES — shared helpers used everywhere
// ─────────────────────────────────────────────────────────────────────────────

const VALID_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
type Month = (typeof VALID_MONTHS)[number];

const MONTH_NUM: Record<string, string> = {
  Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",
  Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12",
};

function monthNum(m: string): number { return parseInt(MONTH_NUM[m] ?? "01", 10); }
function monthPad(m: string): string  { return MONTH_NUM[m] ?? "01"; }

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

/**
 * Normalize string for comparison (remove diacritics, lowercase, trim)
 */
function norm(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Fetch with an absolute timeout. Returns null on any error / timeout.
 * This prevents any single slow API from hanging the whole request.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 6000
): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(timer);
    return res.ok ? res : null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OPENROUTER AI INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

interface OpenRouterConfig {
  apiKey: string;
  model?: string;
}

async function generateAIContent(
  prompt: string,
  config: OpenRouterConfig,
  systemMessage?: string
): Promise<string | null> {
  if (!config.apiKey) return null;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://rihla-travel.com", // Replace with your domain
        "X-Title": "Rihla Travel Sustainability API",
      },
      body: JSON.stringify({
        model: config.model || "openai/gpt-3.5-turbo", // Default model
        messages: [
          ...(systemMessage ? [{ role: "system", content: systemMessage }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("OpenRouter API error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GEOCODING  –  OpenStreetMap Nominatim  (free, no key, worldwide)
//    Handles: Latin, Arabic, Chinese, Thai, Cyrillic, Hebrew, etc.
//    Strategy: forward-geocode the name, then enrich via reverse-geocode.
// ─────────────────────────────────────────────────────────────────────────────

interface GeoResult {
  lat: number; lon: number;
  city: string; country: string; countryCode: string;
  /** OSM relation/node/way ID — used for population lookup later */
  osmId?: string; osmType?: string;
  /** Raw address tags from Nominatim */
  address?: Record<string, string>;
}

async function nominatimForward(query: string): Promise<GeoResult | null> {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&extratags=1`;
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": "Rihla/2.0" } }, 7000);
  if (!res) return null;
  try {
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    return parseNominatimResult(data[0]);
  } catch { return null; }
}

async function nominatimReverse(lat: number, lon: number): Promise<GeoResult | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&extratags=1`;
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": "Rihla/2.0" } }, 7000);
  if (!res) return null;
  try {
    const data = await res.json();
    if (!data?.lat) return null;
    return parseNominatimResult(data);
  } catch { return null; }
}

function parseNominatimResult(r: Record<string, unknown>): GeoResult {
  const addr = (r.address as Record<string, string>) || {};
  // Nominatim address hierarchy for "city" — covers villages, islands, districts
  const city =
    addr.city || addr.town || addr.municipality || addr.village ||
    addr.suburb || addr.county || addr.state ||
    (r.display_name as string)?.split(",")[0] || "";
  return {
    lat: parseFloat(r.lat as string),
    lon: parseFloat(r.lon as string),
    city,
    country: addr.country || "",
    countryCode: (addr.country_code || "").toUpperCase(),
    osmId: r.osm_id as string,
    osmType: r.osm_type as string,
    address: addr,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CLIMATE DATA  –  Open-Meteo Archive  (free, no key, worldwide)
// ─────────────────────────────────────────────────────────────────────────────

interface ClimateData {
  avgTempMax: number; avgTempMin: number;
  maxTemp: number | null; minTemp: number | null;
  totalPrecipitation: number; avgWindSpeed: number;
  precipitationDays: number; aridityIndex: number;
}

async function getClimateData(lat: number, lon: number, month: string): Promise<ClimateData | null> {
  try {
    const now = new Date();
    const mPad = monthPad(month);
    const mInt = parseInt(mPad, 10);
    const year = mInt > now.getMonth() + 1 ? now.getFullYear() - 1 : now.getFullYear();
    const lastDay = new Date(year, mInt, 0).getDate();
    const url =
      `https://archive-api.open-meteo.com/v1/archive` +
      `?latitude=${lat}&longitude=${lon}` +
      `&start_date=${year}-${mPad}-01&end_date=${year}-${mPad}-${lastDay}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,et0_fao_evapotranspiration` +
      `&timezone=auto`;
    const res = await fetchWithTimeout(url, {}, 10000);
    if (!res) return null;
    const data = await res.json();
    if (!data?.daily) return null;

    const nn = (v: number | null) => v !== null && v !== undefined;
    const maxT: number[] = (data.daily.temperature_2m_max ?? []).filter(nn);
    const minT: number[] = (data.daily.temperature_2m_min ?? []).filter(nn);
    const prec: number[] = (data.daily.precipitation_sum ?? []).filter(nn);
    const wind: number[] = (data.daily.wind_speed_10m_max ?? []).filter(nn);
    const et0:  number[] = (data.daily.et0_fao_evapotranspiration ?? []).filter(nn);

    const totalPrecip = prec.reduce((a, b) => a + b, 0);
    const totalEt0    = et0.reduce((a, b) => a + b, 0);

    return {
      avgTempMax: avg(maxT),
      avgTempMin: avg(minT),
      maxTemp: maxT.length ? Math.max(...maxT) : null,
      minTemp: minT.length ? Math.min(...minT) : null,
      totalPrecipitation: totalPrecip,
      avgWindSpeed: avg(wind),
      precipitationDays: prec.filter(p => p > 0.1).length,
      aridityIndex: totalEt0 > 0
        ? Math.round((totalPrecip / totalEt0) * 100) / 100
        : 1.0,
    };
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COUNTRY DATA  –  RestCountries  (free, no key, ~250 countries)
//    Priority: ISO code lookup (most reliable) → name lookup → partial name
// ─────────────────────────────────────────────────────────────────────────────

interface CountryData {
  name: string; capital?: string; region: string; subregion: string;
  population: number; area: number;
  cca2: string; cca3: string;
  currencies?: Record<string, unknown>;
  languages?: Record<string, string>;
  timezones?: string[]; borders?: string[];
}

async function fetchCountry(path: string): Promise<CountryData | null> {
  const res = await fetchWithTimeout(`https://restcountries.com/v3.1/${path}`, {}, 6000);
  if (!res) return null;
  try {
    const data = await res.json();
    const list = Array.isArray(data) ? data : [data];
    if (!list.length) return null;
    const c = list[0];
    return {
      name: c.name?.common ?? "",
      capital: c.capital?.[0],
      region: c.region ?? "",
      subregion: c.subregion ?? "",
      population: c.population ?? 0,
      area: c.area ?? 0,
      cca2: c.cca2 ?? "",
      cca3: c.cca3 ?? "",
      currencies: c.currencies,
      languages: c.languages,
      timezones: c.timezones,
      borders: c.borders,
    };
  } catch { return null; }
}

async function getCountryData(name: string, code2?: string, code3?: string): Promise<CountryData | null> {
  // 1. By ISO-2 code — most reliable
  if (code2) {
    const r = await fetchCountry(`alpha/${code2}`);
    if (r) return r;
  }
  // 2. By ISO-3 code
  if (code3) {
    const r = await fetchCountry(`alpha/${code3}`);
    if (r) return r;
  }
  // 3. Full-text name match
  if (name) {
    const r = await fetchCountry(`name/${encodeURIComponent(name)}?fullText=true`);
    if (r) return r;
    // 4. Partial name match (catches "UAE", "South Korea", etc.)
    const r2 = await fetchCountry(`name/${encodeURIComponent(name)}`);
    if (r2) return r2;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. POPULATION  –  Multi-source waterfall
//    Tier 1: GeoDB (RapidAPI) — best data, but needs key + has gaps
//    Tier 2: GeoNames          — excellent worldwide, needs free account env var
//    Tier 3: OSM Nominatim extratags — population tag often present, no key
//    Tier 4: OSM Overpass      — direct tag lookup by OSM ID (fast & accurate)
//    Tier 5: Country-derived   — smart estimate based on city role + country size
// ─────────────────────────────────────────────────────────────────────────────

async function popFromGeoDB(cityName: string, countryCode2: string): Promise<number | null> {
  if (!process.env.RAPIDAPI_KEY) return null;
  const url =
    `https://wft-geo-db.p.rapidapi.com/v1/geo/cities` +
    `?namePrefix=${encodeURIComponent(cityName)}` +
    (countryCode2 ? `&countryIds=${encodeURIComponent(countryCode2)}` : "") +
    `&limit=1&sort=-population&minPopulation=1000`;
  const res = await fetchWithTimeout(url, {
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
    },
  }, 5000);
  if (!res) return null;
  try {
    const d = await res.json();
    const pop = d?.data?.[0]?.population;
    return pop > 0 ? pop : null;
  } catch { return null; }
}

async function popFromGeoNames(cityName: string, countryCode2: string): Promise<number | null> {
  const user = process.env.GEONAMES_USERNAME;
  if (!user) return null;
  const url =
    `http://api.geonames.org/searchJSON` +
    `?q=${encodeURIComponent(cityName)}&country=${encodeURIComponent(countryCode2)}` +
    `&maxRows=1&featureClass=P&orderby=population&username=${user}`;
  const res = await fetchWithTimeout(url, {}, 5000);
  if (!res) return null;
  try {
    const d = await res.json();
    const pop = d?.geonames?.[0]?.population;
    return pop > 0 ? pop : null;
  } catch { return null; }
}

/**
 * Read population from the Nominatim "extratags" that were fetched during geocode.
 * This is free data we already have — just parse it.
 */
function popFromNominatimExtratags(geoResult: GeoResult): number | null {
  const tags = (geoResult as unknown as Record<string, Record<string, string>>).extratags ?? {};
  const raw = tags["population"] || tags["population:total"];
  if (!raw) return null;
  const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
  return n > 100 ? n : null;
}

/**
 * OSM Overpass: fetch by OSM ID (exact match, very fast, no regex timeout risk).
 * Falls back to bounding-box area search if no OSM ID available.
 */
async function popFromOverpass(
  cityName: string, lat: number, lon: number,
  osmId?: string, osmType?: string
): Promise<number | null> {
  let query: string;

  if (osmId && osmType) {
    // Exact node/way/relation lookup — fastest, most reliable
    const typeChar = osmType === "relation" ? "relation" : osmType === "way" ? "way" : "node";
    query = `[out:json][timeout:8]; ${typeChar}(${osmId}); out tags 1;`;
  } else {
    // Bounding-box search: look for admin boundaries with population tag near coords
    const d = 0.3; // ~33km box
    const safeName = cityName.replace(/[^a-zA-Z0-9 \-]/g, "").trim();
    if (!safeName) return null;
    query =
      `[out:json][timeout:8];` +
      `(relation["name"="${safeName}"]["population"](${lat-d},${lon-d},${lat+d},${lon+d});` +
      ` node["name"="${safeName}"]["population"](${lat-d},${lon-d},${lat+d},${lon+d}););` +
      `out tags 1;`;
  }

  const res = await fetchWithTimeout("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  }, 9000);
  if (!res) return null;

  try {
    const d = await res.json();
    for (const el of (d.elements ?? []) as Array<{ tags?: Record<string, string> }>) {
      const raw = el.tags?.population || el.tags?.["population:total"];
      if (raw) {
        const n = parseInt(raw.replace(/[^0-9]/g, ""), 10);
        if (n > 100) return n;
      }
    }
    return null;
  } catch { return null; }
}

/**
 * Smart population estimate when all APIs fail.
 * Uses country population + city role (capital vs major vs ordinary).
 * Adjusted for city-states (area < 2000 km²) where city ≈ country.
 */
function popEstimate(
  countryPop: number | undefined,
  countryArea: number | undefined,
  isCapital: boolean,
  isMajorCity: boolean
): number {
  if (!countryPop) return 500_000;
  const area = countryArea ?? Infinity;
  // City-state: the entire country IS the city
  if (area < 2_000) return countryPop;
  if (isCapital)    return Math.round(Math.min(countryPop * 0.20, 5_000_000));
  if (isMajorCity)  return Math.round(Math.min(countryPop * 0.10, 2_000_000));
  return Math.round(Math.min(countryPop * 0.05, 1_000_000));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. WORLD BANK  –  Tourism arrivals + CO₂  (free, no key, ~200 countries)
// ─────────────────────────────────────────────────────────────────────────────

async function wbIndicator(code2: string, indicator: string): Promise<number | null> {
  const url =
    `https://api.worldbank.org/v2/country/${code2}/indicator/${indicator}` +
    `?format=json&mrv=10&per_page=10`;
  const res = await fetchWithTimeout(url, {}, 7000);
  if (!res) return null;
  try {
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) return null;
    for (const e of (data[1] as Array<{ value: number | null }>)) {
      if (e.value !== null && e.value > 0) return e.value;
    }
    return null;
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. VISITOR ESTIMATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Distribute country-level World Bank arrivals to city level.
 *
 * Real-world calibration:
 *   Bangkok  38M / Thailand  40M = 95%  (city pop 10M / country 70M = 14%) → multiplier 6.8
 *   Paris    30M / France    89M = 34%  (city pop  2M / country 67M =  3%) → multiplier 11
 *   Tokyo    15M / Japan     32M = 47%  (city pop 13M / country126M = 10%) → multiplier 4.7
 *   NYC      14M / USA       77M = 18%  (city pop  8M / country330M =  2%) → multiplier 9
 *   Dubai    16M / UAE       17M = 94%  (city pop  3M / country  9M = 33%) → multiplier 2.8
 *   Istanbul 15M / Turkey    51M = 29%  (city pop 15M / country84M = 18%) → multiplier 1.6
 */
function estimateCityAnnualVisitors(
  countryArrivals: number,
  cityPop: number,
  nationalPop: number,
  isCapital: boolean,
  isCityState: boolean,
): number {
  if (isCityState) return countryArrivals; // city = country

  const popShare = cityPop / nationalPop;

  let mult: number;
  if      (cityPop > 10_000_000) mult = 20;
  else if (cityPop >  8_000_000) mult = 25;
  else if (cityPop >  5_000_000) mult = 30;
  else if (cityPop >  3_000_000) mult = 22;
  else if (cityPop >  2_000_000) mult = 18;
  else if (cityPop >  1_000_000) mult = 12;
  else if (cityPop >    500_000) mult = 8;
  else if (cityPop >    200_000) mult = 5;
  else if (cityPop >    100_000) mult = 3;
  else                           mult = 1.5;

  if (isCapital) mult *= 2.5;

  const share = Math.min(popShare * mult, 0.85);
  const minShare = 0.005; // at least 0.5% of country arrivals

  return Math.round(countryArrivals * Math.max(share, minShare));
}

/**
 * Calibrated fallback when World Bank data is absent.
 * Uses regional tourism intensity + city size.
 * Regions: Europe/N.America are high-intensity; Africa/S.Asia lower.
 */
function fallbackAnnualVisitors(
  cityPop: number,
  isCapital: boolean,
  isCityState: boolean,
  region: string,
  subregion: string,
  countryPop: number,
): number {
  // Tourism intensity multiplier by region (visitors-per-resident ratio for typical city)
  let regionMult = 1.0;
  if (["Western Europe","Northern Europe","Southern Europe"].includes(subregion)) regionMult = 14;
  else if (["Northern America"].includes(subregion))                              regionMult = 10;
  else if (["Eastern Europe","Caribbean","Polynesia"].includes(subregion))        regionMult = 7;
  else if (["South-Eastern Asia","Eastern Asia"].includes(subregion))             regionMult = 8;
  else if (["Western Asia","Australia and New Zealand"].includes(subregion))      regionMult = 6;
  else if (["South America","Central America"].includes(subregion))               regionMult = 5;
  else if (["Northern Africa","Southern Africa"].includes(subregion))             regionMult = 4;
  else if (["Eastern Africa","Western Africa","Middle Africa"].includes(subregion)) regionMult = 2;
  else if (["Southern Asia"].includes(subregion))                                 regionMult = 3;
  else                                                                             regionMult = 4;

  // City-size scaling: larger cities punch above their weight in tourism
  let sizeMult: number;
  if      (cityPop > 8_000_000) sizeMult = 7;
  else if (cityPop > 5_000_000) sizeMult = 6;
  else if (cityPop > 3_000_000) sizeMult = 8;
  else if (cityPop > 2_000_000) sizeMult = 10;
  else if (cityPop > 1_000_000) sizeMult = 8;
  else if (cityPop > 500_000)   sizeMult = 5;
  else if (cityPop > 200_000)   sizeMult = 3;
  else if (cityPop > 100_000)   sizeMult = 2;
  else                          sizeMult = 1.5;

  const capitalBonus = isCapital ? 2.0 : 1.0;
  if (isCityState) return Math.round(cityPop * regionMult * 0.5); // city-state: arrivals ≈ 0.5× pop × region

  return Math.round(cityPop * sizeMult * capitalBonus);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SEASONAL FACTOR
//    Accounts for hemisphere, latitude band, and climate type.
//    Desert cities (hot/arid) peak in winter; tropical cities in dry season.
// ─────────────────────────────────────────────────────────────────────────────

function getSeasonalFactor(mNum: number, lat: number, climateData: ClimateData | null): number {
  const absLat = Math.abs(lat);
  const isNorth = lat >= 0;

  // Hot desert / semi-arid: peak in "cool" months regardless of hemisphere
  // Detect via high temp + low aridity
  if (climateData && climateData.aridityIndex < 0.35 && climateData.avgTempMax > 28) {
    // Peak = Oct-Mar (northern) or Apr-Sep (southern)
    const coolMonths = isNorth ? [10,11,12,1,2,3] : [4,5,6,7,8,9];
    const shoulderCool = isNorth ? [4,9] : [3,10];
    if (coolMonths.includes(mNum)) return 1.5;
    if (shoulderCool.includes(mNum)) return 1.1;
    return 0.55; // Hot months: tourists avoid
  }

  // Equatorial / tropical (|lat| < 12°): driven by dry season
  if (absLat < 12) {
    // Dry season varies by location but roughly Nov-Mar for most equatorial
    const dryPeak = isNorth ? [11,12,1,2,3] : [6,7,8,9,10];
    const shoulder = isNorth ? [10,4] : [5,11];
    if (dryPeak.includes(mNum)) return 1.3;
    if (shoulder.includes(mNum)) return 1.0;
    return 0.85;
  }

  // Subtropical (12–30°): mild winters, hot summers → peaks in spring/autumn
  if (absLat < 30) {
    const springAutumn = isNorth ? [3,4,5,9,10,11] : [9,10,11,3,4,5];
    const peak = isNorth ? [3,4,10,11] : [9,10,3,4];
    if (peak.includes(mNum)) return 1.45;
    if (springAutumn.includes(mNum)) return 1.2;
    const summer = isNorth ? [6,7,8] : [12,1,2];
    return summer.includes(mNum) ? 0.7 : 0.65;
  }

  // Temperate / high latitude (30°+): summer peak
  const summerMonths  = isNorth ? [6,7,8]     : [12,1,2];
  const shoulderMonths = isNorth ? [4,5,9,10] : [3,4,10,11];
  if (summerMonths.includes(mNum))   return 1.5;
  if (shoulderMonths.includes(mNum)) return 1.15;
  return 0.65;
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SCORING
// ─────────────────────────────────────────────────────────────────────────────

function calculateEcoScore(climate: ClimateData | null, pop: number): number {
  let score = 65;
  if (climate) {
    const t = climate.avgTempMax;
    if      (t > 42) score -= 20;
    else if (t > 38) score -= 15;
    else if (t > 34) score -= 10;
    else if (t > 30) score -= 5;
    else if (t > 26) score -= 2;
    else if (t >= 18 && t <= 26) score += 5;

    const mn = climate.avgTempMin;
    if      (mn < -15) score -= 12;
    else if (mn <  -5) score -= 8;
    else if (mn <   0) score -= 4;

    const ai = climate.aridityIndex;
    if      (ai < 0.15) score -= 18;
    else if (ai < 0.30) score -= 12;
    else if (ai < 0.50) score -= 7;
    else if (ai < 0.65) score -= 3;
    else if (ai >= 0.65 && ai <= 1.5) score += 4;

    const pd = climate.precipitationDays;
    if      (pd > 20) score -= 6;
    else if (pd > 15) score -= 2;
    else if (pd >= 5 && pd <= 12) score += 3;
    else if (pd < 2)  score -= 5;
  }

  if      (pop > 10_000_000) score -= 20;
  else if (pop >  5_000_000) score -= 15;
  else if (pop >  2_000_000) score -= 10;
  else if (pop >  1_000_000) score -= 7;
  else if (pop >    500_000) score -= 4;
  else if (pop >    200_000) score -= 2;
  else if (pop <     50_000) score += 8;
  else if (pop <    150_000) score += 4;

  return Math.max(20, Math.min(98, Math.round(score)));
}

function getWaterStress(c: ClimateData | null): "low" | "moderate" | "high" {
  if (!c) return "moderate";
  if (c.aridityIndex < 0.30 || c.totalPrecipitation < 20) return "high";
  if (c.aridityIndex < 0.65 || c.totalPrecipitation < 60) return "moderate";
  return "low";
}

function carbonEstimate(co2Tonnes: number | null, pop: number): number {
  if (co2Tonnes && co2Tonnes > 0) {
    return Math.max(1, Math.round((co2Tonnes / 365) * 7 * 1.5 * 1000 * 10) / 10);
  }
  if (pop > 5_000_000) return 15;
  if (pop > 1_000_000) return 10;
  if (pop >   500_000) return 7;
  if (pop >   100_000) return 5;
  return 3;
}

function crowdLevel(monthly: number, pop: number): "low" | "moderate" | "high" {
  if (!pop) return "low";
  const r = monthly / pop;
  if (r > 0.25 || monthly > 2_000_000) return "high";
  if (r > 0.08 || monthly >   400_000) return "moderate";
  return "low";
}

function crowdScore(monthly: number, pop: number): number {
  if (!pop) return 10;
  const r = monthly / pop;
  if (r > 1.0) return 98; if (r > 0.5) return 90; if (r > 0.25) return 80;
  if (r > 0.15) return 68; if (r > 0.08) return 52; if (r > 0.03) return 35;
  return 18;
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. AI-ENHANCED RECOMMENDATIONS
// ─────────────────────────────────────────────────────────────────────────────

interface AIEnhancedContent {
  summary?: string;
  personalizedTips?: string[];
  culturalNotes?: string[];
  hiddenGems?: string[];
  sustainabilityInsights?: string;
}

async function generateAIRecommendations(
  location: string,
  month: string,
  climateData: ClimateData | null,
  crowdLevel: string,
  ecoScore: number,
  countryData: CountryData | null,
  openRouterConfig: OpenRouterConfig
): Promise<AIEnhancedContent | null> {
  if (!openRouterConfig.apiKey) return null;

  const climateDesc = climateData 
    ? `Average max temp: ${climateData.avgTempMax}°C, min: ${climateData.avgTempMin}°C, precipitation: ${climateData.totalPrecipitation}mm, ${climateData.precipitationDays} rainy days`
    : "Climate data unavailable";

  const prompt = `Generate sustainable travel recommendations for ${location} in ${month}.

Context:
- Crowd level: ${crowdLevel}
- Eco score: ${ecoScore}/100
- Climate: ${climateDesc}
- Country: ${countryData?.name || "Unknown"}
- Region: ${countryData?.region || "Unknown"}

Please provide:
1. A brief summary of what makes this destination sustainable/challenging in this month (2-3 sentences)
2. 3-4 personalized sustainability tips specific to this location and month
3. 2-3 cultural notes about local sustainability practices
4. 2-3 off-the-beaten-path alternatives nearby
5. One key insight about the destination's sustainability challenges

Format as JSON with keys: summary, personalizedTips (array), culturalNotes (array), hiddenGems (array), sustainabilityInsights (string)`;

  const systemMessage = "You are a sustainable travel expert. Provide concise, accurate, and helpful recommendations. Return only valid JSON.";

  try {
    const response = await generateAIContent(prompt, openRouterConfig, systemMessage);
    if (!response) return null;

    // Parse the JSON response
    const parsed = JSON.parse(response);
    return {
      summary: parsed.summary,
      personalizedTips: parsed.personalizedTips || [],
      culturalNotes: parsed.culturalNotes || [],
      hiddenGems: parsed.hiddenGems || [],
      sustainabilityInsights: parsed.sustainabilityInsights,
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. MAIN ROUTE
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("🌍 [Sustainability API] Request received");
  try {
    const body = await req.json();

    // ── Validation ────────────────────────────────────────────────────────
    if (!body.month || !VALID_MONTHS.includes(body.month)) {
      return NextResponse.json(
        { error: "Invalid or missing month. Use Jan/Feb/…/Dec" }, { status: 400 }
      );
    }
    if (!body.name && !body.country && (!body.lat || !body.lon)) {
      return NextResponse.json(
        { error: "Provide at least: name, or country, or lat+lon" }, { status: 400 }
      );
    }

    // ── OpenRouter Configuration ───────────────────────────────────────────
    const openRouterConfig: OpenRouterConfig = {
      apiKey: process.env.OPENROUTER_API_KEY || "",
      model: process.env.OPENROUTER_MODEL || "openai/gpt-3.5-turbo",
    };

    // ── Location resolution ───────────────────────────────────────────────
    let locName:    string = (body.name    ?? "").trim();
    let locCountry: string = (body.country ?? "").trim();
    let lat:   number | null = body.lat  ?? null;
    let lon:   number | null = body.lon  ?? null;
    let cc2 = "";        // ISO-2 country code
    let osmGeo: GeoResult | null = null;

    // Step 1: if we have a name, forward-geocode to get coordinates + ISO code
    if (locName && (!lat || !lon)) {
      const query = locCountry ? `${locName}, ${locCountry}` : locName;
      osmGeo = await nominatimForward(query);
      if (osmGeo) {
        lat = osmGeo.lat; lon = osmGeo.lon;
        if (!locName)    locName    = osmGeo.city;
        if (!locCountry) locCountry = osmGeo.country;
        if (!cc2)        cc2        = osmGeo.countryCode;
      }
    }

    // Step 2: if we have coords but no name/country, reverse-geocode
    if (lat && lon && (!locName || !locCountry || !cc2)) {
      const rev = await nominatimReverse(lat, lon);
      if (rev) {
        if (!osmGeo)     osmGeo     = rev;
        if (!locName)    locName    = rev.city;
        if (!locCountry) locCountry = rev.country;
        if (!cc2)        cc2        = rev.countryCode;
      }
    }

    // Step 3: if we still have coords but no osmGeo, reverse-geocode for OSM data
    if (lat && lon && !osmGeo) {
      osmGeo = await nominatimReverse(lat, lon);
    }

    // ── Country data (needed for national pop + capital detection) ────────
    const countryData = await getCountryData(locCountry, cc2 || undefined);
    if (!cc2 && countryData?.cca2)  cc2 = countryData.cca2;
    const cc3 = countryData?.cca3 ?? "";

    // ── City-state detection ──────────────────────────────────────────────
    const isCityState = !!(countryData?.area && countryData.area < 2_000);

    // ── Capital detection ─────────────────────────────────────────────────
    // Compare normalised strings; strip diacritics for robustness
    const capitalNorm = norm(countryData?.capital ?? "");
    const cityNorm    = norm(locName);
    const isCapital =
      capitalNorm.length > 0 &&
      (cityNorm === capitalNorm ||
       cityNorm.startsWith(capitalNorm) ||
       capitalNorm.startsWith(cityNorm));

    // ── Parallel: climate + World Bank ────────────────────────────────────
    const [climateData, countryArrivals, co2PerCapita] = await Promise.all([
      (lat && lon) ? getClimateData(lat, lon, body.month) : Promise.resolve(null),
      cc2 ? wbIndicator(cc2, "ST.INT.ARVL")       : Promise.resolve(null),
      cc2 ? wbIndicator(cc2, "EN.ATM.CO2E.PC")    : Promise.resolve(null),
    ]);

    // ── Population waterfall ──────────────────────────────────────────────
    let population = 0;
    let popSource  = "none";

    // Tier 1: GeoDB
    if (!population && locName) {
      const p = await popFromGeoDB(locName, cc2);
      if (p) { population = p; popSource = "GeoDB"; }
    }

    // Tier 2: GeoNames
    if (!population && locName && cc2) {
      const p = await popFromGeoNames(locName, cc2);
      if (p) { population = p; popSource = "GeoNames"; }
    }

    // Tier 3: Nominatim extratags (zero cost — data we already have)
    if (!population && osmGeo) {
      const p = popFromNominatimExtratags(osmGeo);
      if (p) { population = p; popSource = "Nominatim-extratags"; }
    }

    // Tier 4: OSM Overpass (by OSM ID if available, else bbox)
    if (!population && lat && lon) {
      const p = await popFromOverpass(locName, lat, lon, osmGeo?.osmId, osmGeo?.osmType);
      if (p) { population = p; popSource = "OSM-Overpass"; }
    }

    // Tier 5: Smart estimate from country data + city role
    if (!population) {
      const isMajor = !isCapital; // treat non-capital as "major city" (conservative)
      population = popEstimate(countryData?.population, countryData?.area, isCapital, isMajor);
      popSource  = "smart-estimate";
      console.warn(`⚠️  [${locName}] population estimated at ${population} (no API data)`);
    }

    // Hard floor
    if (population < 1_000) { population = 100_000; popSource = "floor"; }

    // ── Visitor pipeline ──────────────────────────────────────────────────
    const resolvedLat = lat ?? 0;
    const mNum        = monthNum(body.month);

    const cityAnnualVisitors = (countryArrivals && countryData?.population)
      ? estimateCityAnnualVisitors(
          countryArrivals, population, countryData.population,
          isCapital, isCityState
        )
      : null;

    const fallback = fallbackAnnualVisitors(
      population, isCapital, isCityState,
      countryData?.region ?? "", countryData?.subregion ?? "",
      countryData?.population ?? 0
    );

    const baseAnnual      = cityAnnualVisitors ?? fallback;
    const seasonalFactor  = getSeasonalFactor(mNum, resolvedLat, climateData);
    const monthlyVisitors = Math.max(1_000, Math.round((baseAnnual / 12) * seasonalFactor));

    console.log("🌍 [Visitor pipeline]", {
      locName, cc2,
      population, popSource,
      countryArrivals, cityAnnualVisitors, fallback,
      baseAnnual, seasonalFactor, monthlyVisitors,
      isCapital, isCityState,
    });

    // ── Scores ────────────────────────────────────────────────────────────
    const ecoScore    = calculateEcoScore(climateData, population);
    const waterStress = getWaterStress(climateData);
    const carbon      = carbonEstimate(co2PerCapita, population);
    const cLevel      = crowdLevel(monthlyVisitors, population);
    const cScore      = crowdScore(monthlyVisitors, population);
    const susRating   = ecoScore >= 80 ? "A" : ecoScore >= 65 ? "B" : ecoScore >= 45 ? "C" : "D";

    // ── AI-Enhanced Content (if OpenRouter key is available) ───────────────
    const aiContent = await generateAIRecommendations(
      locName,
      body.month,
      climateData,
      cLevel,
      ecoScore,
      countryData,
      openRouterConfig
    );

    // ── Monthly trend ─────────────────────────────────────────────────────
    const monthlyTrend = VALID_MONTHS.map((m) => {
      const mn  = monthNum(m);
      const sf  = getSeasonalFactor(mn, resolvedLat, climateData);
      const vis = Math.max(1_000, Math.round((baseAnnual / 12) * sf));
      // Eco score shifts slightly with seasons (temp-driven)
      const td  = climateData
        ? (mn >= 6 && mn <= 8 ? 2 : mn <= 2 || mn === 12 ? -2 : 0)
        : 0;
      return {
        month: m,
        visitors: vis,
        eco_score: Math.round(Math.max(20, Math.min(98, ecoScore + td))),
        seasonal_factor: sf,
      };
    });

    // ── Visit time recommendations (climate-driven + AI-enhanced) ─────────
    const bestVisitTimes: string[] = [];
    if (climateData?.avgTempMax > 32) {
      bestVisitTimes.push("Early morning (6–10am)", "Late evening (5–8pm)");
    } else if (climateData?.avgTempMax < 10) {
      bestVisitTimes.push("Midday (11am–3pm) for warmth");
    } else {
      bestVisitTimes.push("Morning (9–11am)", "Afternoon (2–5pm)");
    }

    // ── Response ──────────────────────────────────────────────────────────
    return NextResponse.json({
      // Core metrics
      crowd_forecast: cLevel,
      crowd_score: cScore,
      best_visit_times: bestVisitTimes.slice(0, 2),
      eco_score: ecoScore,
      carbon_estimate_kg: carbon,
      water_stress: waterStress,
      sustainability_rating: susRating,
      
      // AI-enhanced content (if available)
      ...(aiContent && {
        ai_summary: aiContent.summary,
        ai_personalized_tips: aiContent.personalizedTips,
        ai_cultural_notes: aiContent.culturalNotes,
        ai_hidden_gems: aiContent.hiddenGems,
        ai_sustainability_insights: aiContent.sustainabilityInsights,
      }),
      
      // Default fallback content (used if AI is unavailable)
      green_practices: aiContent?.personalizedTips?.length ? [] : [
        "Use public transportation",
        "Support local businesses",
        "Bring a reusable water bottle",
        "Choose eco-certified accommodations",
      ],
      responsible_tips: aiContent?.personalizedTips?.length ? [] : [
        "Respect local customs and traditions",
        "Stay on designated trails",
        "Avoid single-use plastics",
        "Book with certified local guides",
      ],
      
      avoid_periods: cLevel === "high"
        ? ["Peak tourist season", "Weekend afternoons"]
        : ["Weekend afternoons"],
      local_initiatives: [
        "Community tourism projects",
        "Local conservation efforts",
        "Sustainable development programs",
      ],
      alternative_destinations: aiContent?.hiddenGems?.length ? aiContent.hiddenGems : [
        "Nearby smaller towns", "Rural areas", "Neighboring regions"
      ],
      carrying_capacity_alert: cLevel === "high",
      monthly_trend: monthlyTrend,

      _metadata: {
        location: {
          name: locName || null,
          country: locCountry || null,
          lat: lat ?? null,
          lon: lon ?? null,
          population,
          population_source: popSource,
          countryCode2: cc2 || null,
          countryCode3: cc3 || null,
          isCapital,
          isCityState,
          region: countryData?.region ?? null,
          subregion: countryData?.subregion ?? null,
        },
        data_sources: {
          climate:          climateData    ? "Open-Meteo Archive API"   : null,
          country:          countryData    ? "RestCountries API"        : null,
          tourism_arrivals: countryArrivals !== null ? "World Bank ST.INT.ARVL"    : null,
          co2:              co2PerCapita   !== null ? "World Bank EN.ATM.CO2E.PC" : null,
          geocoding:        "OpenStreetMap Nominatim",
          population:       popSource,
          ai_enhanced:      !!aiContent ? "OpenRouter AI" : null,
        },
        tourism: {
          country_annual_arrivals:         countryArrivals,
          city_annual_visitors_estimated:  cityAnnualVisitors,
          fallback_annual_visitors:        cityAnnualVisitors === null ? fallback : null,
          monthly_visitors_selected_month: monthlyVisitors,
          seasonal_factor:                 seasonalFactor,
          co2_per_capita_tonnes:           co2PerCapita,
        },
        climate: climateData,
      },
    });

  } catch (err: unknown) {
    const e = err as Error;
    console.error("🌍 [Sustainability API] Fatal error:", e);
    return NextResponse.json(
      { error: "Failed to generate insights", detail: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
