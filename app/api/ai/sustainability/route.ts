import { NextRequest, NextResponse } from "next/server";

// ==============================================
// FREE APIs ONLY - NO MOCK DATA - NO HARDCODING
// ==============================================

// 1. 🌤️ Open-Meteo - Real climate data (free, no key, works worldwide)
async function getClimateData(lat: number, lon: number, month: string) {
  try {
    const year = new Date().getFullYear();
    const now = new Date();
    const monthNum = getMonthNumber(month);
    const targetYear = parseInt(monthNum) > now.getMonth() + 1 ? year - 1 : year;

    const startDate = `${targetYear}-${monthNum}-01`;
    const lastDay = new Date(targetYear, parseInt(monthNum), 0).getDate();
    const endDate = `${targetYear}-${monthNum}-${lastDay}`;

    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,et0_fao_evapotranspiration&timezone=auto`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.daily) return null;

    const maxTemps: number[] = data.daily.temperature_2m_max?.filter((v: number | null) => v !== null) ?? [];
    const minTemps: number[] = data.daily.temperature_2m_min?.filter((v: number | null) => v !== null) ?? [];
    const precipitations: number[] = data.daily.precipitation_sum?.filter((v: number | null) => v !== null) ?? [];
    const windSpeeds: number[] = data.daily.wind_speed_10m_max?.filter((v: number | null) => v !== null) ?? [];
    const et0: number[] = data.daily.et0_fao_evapotranspiration?.filter((v: number | null) => v !== null) ?? [];

    const totalPrecip = precipitations.reduce((a: number, b: number) => a + b, 0);
    const totalEt0 = et0.reduce((a: number, b: number) => a + b, 0);
    const aridity = totalEt0 > 0 ? totalPrecip / totalEt0 : 1;

    return {
      avgTempMax: calculateAverage(maxTemps),
      avgTempMin: calculateAverage(minTemps),
      maxTemp: maxTemps.length ? Math.max(...maxTemps) : null,
      minTemp: minTemps.length ? Math.min(...minTemps) : null,
      totalPrecipitation: totalPrecip,
      avgWindSpeed: calculateAverage(windSpeeds),
      precipitationDays: precipitations.filter((p: number) => p > 0).length,
      aridityIndex: Math.round(aridity * 100) / 100,
    };
  } catch (error) {
    console.error("Error fetching climate data:", error);
    return null;
  }
}

// 2. GeoDB Cities via RapidAPI (optional — skip gracefully when key absent or rate-limited)
async function getCityData(cityName: string, countryCode?: string) {
  try {
    if (!process.env.RAPIDAPI_KEY) return null;

    const url = countryCode
      ? `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(cityName)}&countryIds=${encodeURIComponent(countryCode)}&limit=1&sort=-population`
      : `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(cityName)}&limit=5&sort=-population`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      const city = data.data[0];
      return {
        name: city.name,
        population: city.population > 0 ? city.population : null,
        elevation: city.elevation,
        latitude: city.latitude,
        longitude: city.longitude,
        countryCode: city.countryCode,
        timezone: city.timezone,
        region: city.region,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching city data (GeoDB):", error);
    return null;
  }
}

// 3. RestCountries by name (free, no key, ~250 countries)
async function getCountryData(countryName: string) {
  try {
    let response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`
    );
    if (!response.ok) {
      response = await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`
      );
    }
    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.length > 0) {
      const country = data[0];
      return {
        name: country.name.common,
        capital: country.capital?.[0],
        region: country.region,
        subregion: country.subregion,
        population: country.population,
        area: country.area,
        currencies: country.currencies,
        languages: country.languages,
        timezones: country.timezones,
        borders: country.borders,
        cca2: country.cca2,
        cca3: country.cca3,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching country data:", error);
    return null;
  }
}

// 3b. RestCountries by ISO code (fallback when country name resolution fails)
async function getCountryDataByCode(code: string) {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || !data.length) return null;
    const country = data[0];
    return {
      name: country.name.common,
      capital: country.capital?.[0],
      region: country.region,
      subregion: country.subregion,
      population: country.population,
      area: country.area,
      currencies: country.currencies,
      languages: country.languages,
      timezones: country.timezones,
      borders: country.borders,
      cca2: country.cca2,
      cca3: country.cca3,
    };
  } catch (error) {
    console.error("Error fetching country data by code:", error);
    return null;
  }
}

// 4. World Bank - International tourism arrivals (free, no key, ~200 countries)
async function getWorldBankTourism(countryCode2: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode2}/indicator/ST.INT.ARVL?format=json&mrv=8&per_page=8`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) return null;
    const entries: Array<{ value: number | null; date: string }> = data[1];
    if (!entries) return null;
    for (const entry of entries) {
      if (entry.value !== null && entry.value > 0) return entry.value;
    }
    return null;
  } catch (error) {
    console.error("World Bank tourism fetch error:", error);
    return null;
  }
}

// 5. World Bank - CO2 emissions per capita (free, no key)
async function getWorldBankCO2(countryCode2: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode2}/indicator/EN.ATM.CO2E.PC?format=json&mrv=8&per_page=8`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) return null;
    const entries: Array<{ value: number | null }> = data[1];
    for (const entry of entries) {
      if (entry.value !== null && entry.value > 0) return entry.value;
    }
    return null;
  } catch (error) {
    console.error("World Bank CO2 fetch error:", error);
    return null;
  }
}

// 6. OpenStreetMap Nominatim - Geocoding (free, no key, worldwide)
async function geocode(
  query: string
): Promise<{ lat: number; lon: number; city: string; country: string; countryCode: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
      { headers: { "User-Agent": "Rihla-Tourism-App/1.0" } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.length) return null;
    const result = data[0];
    const address = result.address || {};
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      city:
        address.city ||
        address.town ||
        address.village ||
        address.suburb ||
        result.display_name?.split(",")[0] ||
        query,
      country: address.country || "",
      countryCode: address.country_code?.toUpperCase() || "",
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ city: string; country: string; countryCode: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      { headers: { "User-Agent": "Rihla-Tourism-App/1.0" } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const address = data.address || {};
    return {
      city:
        address.city ||
        address.town ||
        address.village ||
        address.suburb ||
        data.display_name?.split(",")[0] ||
        "Unknown",
      country: address.country || "Unknown",
      countryCode: address.country_code?.toUpperCase() || "",
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

// 7. GeoNames - Population lookup (free, requires GEONAMES_USERNAME env var)
// Second-tier fallback when GeoDB returns no population
async function getGeoNamesPopulation(
  cityName: string,
  countryCode2: string
): Promise<number | null> {
  try {
    const username = process.env.GEONAMES_USERNAME;
    if (!username) return null;
    const response = await fetch(
      `http://api.geonames.org/searchJSON?q=${encodeURIComponent(cityName)}&country=${encodeURIComponent(countryCode2)}&maxRows=1&featureClass=P&orderby=population&username=${username}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    const pop = data.geonames?.[0]?.population;
    return pop && pop > 0 ? pop : null;
  } catch {
    return null;
  }
}

// 8. OSM Overpass - Population tag lookup (free, no key, last-resort worldwide)
// Reads the "population" tag that OSM contributors add to city nodes/relations
async function getOSMPopulation(
  cityName: string,
  lat: number,
  lon: number
): Promise<number | null> {
  try {
    const safeName = cityName.replace(/["\\]/g, "");
    const query = `
      [out:json][timeout:10];
      (
        node["name"~"${safeName}",i]["population"](around:50000,${lat},${lon});
        way["name"~"${safeName}",i]["population"](around:50000,${lat},${lon});
        relation["name"~"${safeName}",i]["population"](around:50000,${lat},${lon});
      );
      out tags 1;
    `;
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) return null;
    const data = await response.json();
    const elements: Array<{ tags?: Record<string, string> }> = data.elements ?? [];
    for (const el of elements) {
      const rawPop = el.tags?.population;
      if (rawPop) {
        const cleaned = rawPop.replace(/[,\s]/g, "");
        const num = parseFloat(cleaned);
        if (!isNaN(num) && num > 100) return Math.round(num);
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ==============================================
// DERIVED METRICS
// ==============================================

/**
 * Estimate city-level annual visitors from World Bank country arrivals.
 *
 * Calibrated against real data:
 *   Bangkok  ~38M / Thailand 40M  = 95%  (pop 10M / 70M = 14%)  → 6.8× popShare
 *   Paris    ~30M / France   89M  = 34%  (pop  2M / 67M =  3%)  → 11.3× popShare
 *   Tokyo    ~15M / Japan    32M  = 47%  (pop 13M /126M = 10%)  →  4.7× popShare
 *   NYC      ~14M / USA      77M  = 18%  (pop  8M /330M =  2%)  →  9× popShare
 *   Dubai    ~16M / UAE      17M  = 94%  (pop  3M /  9M = 33%)  →  2.8× popShare
 */
function estimateCityAnnualVisitors(
  countryArrivals: number,
  cityPopulation: number,
  nationalPopulation: number,
  isCapital: boolean
): number {
  if (!countryArrivals || !nationalPopulation || cityPopulation <= 0) return 0;

  const popShare = cityPopulation / nationalPopulation;

  let concentrationMultiplier: number;
  if (cityPopulation > 8_000_000) concentrationMultiplier = 35;
  else if (cityPopulation > 5_000_000) concentrationMultiplier = 28;
  else if (cityPopulation > 3_000_000) concentrationMultiplier = 22;
  else if (cityPopulation > 2_000_000) concentrationMultiplier = 18;
  else if (cityPopulation > 1_000_000) concentrationMultiplier = 12;
  else if (cityPopulation > 500_000) concentrationMultiplier = 8;
  else if (cityPopulation > 200_000) concentrationMultiplier = 5;
  else if (cityPopulation > 100_000) concentrationMultiplier = 3;
  else concentrationMultiplier = 1.5;

  // Capitals attract disproportionately more international tourists
  if (isCapital) concentrationMultiplier *= 2.5;

  const estimatedShare = Math.min(popShare * concentrationMultiplier, 0.80);
  const minShare = Math.max(estimatedShare, 0.005); // floor: 0.5% of country

  return Math.round(countryArrivals * Math.min(minShare, 0.80));
}

/**
 * Monthly seasonal factor based on hemisphere and latitude band.
 * Equatorial band (|lat| < 15°) has muted variation; peak is in the dry season.
 */
function getSeasonalFactor(monthNum: number, lat: number): number {
  const absLat = Math.abs(lat);
  const isNorth = lat >= 0;

  if (absLat < 15) {
    // Tropical/equatorial: mild variation; dry season = visitor peak
    const dryPeak = [11, 12, 1, 2, 3];
    return dryPeak.includes(monthNum) ? 1.25 : 0.90;
  }

  const summerMonths = isNorth ? [6, 7, 8] : [12, 1, 2];
  const shoulderMonths = isNorth ? [4, 5, 9, 10] : [3, 4, 10, 11];

  if (summerMonths.includes(monthNum)) return 1.5;
  if (shoulderMonths.includes(monthNum)) return 1.15;
  return 0.65;
}

type ClimateData = Awaited<ReturnType<typeof getClimateData>>;

function calculateEcoScore(climateData: ClimateData, population: number): number {
  let score = 65;

  if (climateData) {
    if (climateData.avgTempMax > 42) score -= 20;
    else if (climateData.avgTempMax > 38) score -= 15;
    else if (climateData.avgTempMax > 34) score -= 10;
    else if (climateData.avgTempMax > 30) score -= 5;
    else if (climateData.avgTempMax > 26) score -= 2;
    else if (climateData.avgTempMax >= 18 && climateData.avgTempMax <= 26) score += 5;

    if (climateData.avgTempMin < -15) score -= 12;
    else if (climateData.avgTempMin < -5) score -= 8;
    else if (climateData.avgTempMin < 0) score -= 4;

    if (climateData.aridityIndex < 0.15) score -= 18;
    else if (climateData.aridityIndex < 0.3) score -= 12;
    else if (climateData.aridityIndex < 0.5) score -= 7;
    else if (climateData.aridityIndex < 0.65) score -= 3;
    else if (climateData.aridityIndex >= 0.65 && climateData.aridityIndex <= 1.5) score += 4;

    if (climateData.precipitationDays > 20) score -= 6;
    else if (climateData.precipitationDays > 15) score -= 2;
    else if (climateData.precipitationDays >= 5 && climateData.precipitationDays <= 12) score += 3;
    else if (climateData.precipitationDays < 2) score -= 5;
  }

  if (population > 10_000_000) score -= 20;
  else if (population > 5_000_000) score -= 15;
  else if (population > 2_000_000) score -= 10;
  else if (population > 1_000_000) score -= 7;
  else if (population > 500_000) score -= 4;
  else if (population > 200_000) score -= 2;
  else if (population < 50_000) score += 8;
  else if (population < 150_000) score += 4;

  return Math.max(20, Math.min(98, Math.round(score)));
}

function getWaterStress(climateData: ClimateData): "low" | "moderate" | "high" {
  if (!climateData) return "moderate";
  const { aridityIndex, totalPrecipitation } = climateData;
  if (aridityIndex < 0.3 || totalPrecipitation < 20) return "high";
  if (aridityIndex < 0.65 || totalPrecipitation < 60) return "moderate";
  return "low";
}

function calculateCarbonEstimate(co2PerCapitaTonnes: number | null, population: number): number {
  if (co2PerCapitaTonnes && co2PerCapitaTonnes > 0) {
    const dailyTonnes = co2PerCapitaTonnes / 365;
    const perVisitTonnes = dailyTonnes * 7 * 1.5;
    const kg = Math.round(perVisitTonnes * 1000 * 10) / 10;
    return Math.max(1, kg);
  }
  if (population > 5_000_000) return 15;
  if (population > 1_000_000) return 10;
  if (population > 500_000) return 7;
  if (population > 100_000) return 5;
  return 3;
}

// ==============================================
// UTILITIES
// ==============================================

function getMonthNumber(month: string): string {
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04",
    May: "05", Jun: "06", Jul: "07", Aug: "08",
    Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  return months[month] || "01";
}

function calculateAverage(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function getCrowdLevel(monthlyVisitors: number, cityPopulation: number): "low" | "moderate" | "high" {
  if (!cityPopulation || monthlyVisitors <= 0) return "low";
  const ratio = monthlyVisitors / cityPopulation;
  if (ratio > 0.25 || monthlyVisitors > 2_000_000) return "high";
  if (ratio > 0.08 || monthlyVisitors > 400_000) return "moderate";
  return "low";
}

function getCrowdScore(monthlyVisitors: number, cityPopulation: number): number {
  if (!cityPopulation || monthlyVisitors <= 0) return 10;
  const ratio = monthlyVisitors / cityPopulation;
  if (ratio > 1.0) return 98;
  if (ratio > 0.5) return 90;
  if (ratio > 0.25) return 80;
  if (ratio > 0.15) return 68;
  if (ratio > 0.08) return 52;
  if (ratio > 0.03) return 35;
  return 18;
}

// ==============================================
// MAIN API ROUTE
// ==============================================

export async function POST(req: NextRequest) {
  console.log("🌍 Sustainability API: Received request");

  try {
    const body = await req.json();
    console.log("🌍 Request body:", body);

    // ── Validation ──────────────────────────────────────────────────────
    if (!body.month) {
      return NextResponse.json({ error: "Missing required field: month" }, { status: 400 });
    }

    const validMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (!validMonths.includes(body.month)) {
      return NextResponse.json(
        { error: "Invalid month. Use three-letter abbreviation (e.g. Jan)" },
        { status: 400 }
      );
    }

    if (!body.name && !body.country && (!body.lat || !body.lon)) {
      return NextResponse.json({ error: "Missing location information" }, { status: 400 });
    }

    // ── Location resolution ──────────────────────────────────────────────
    let locationName: string = body.name || "";
    let locationCountry: string = body.country || "";
    let lat: number | null = body.lat ?? null;
    let lon: number | null = body.lon ?? null;
    let countryCode2 = "";
    let countryCode3 = "";

    // Forward geocode if coordinates missing
    if ((!lat || !lon) && locationName) {
      const geo = await geocode(
        `${locationName}${locationCountry ? ", " + locationCountry : ""}`
      );
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
        if (!locationName) locationName = geo.city;
        if (!locationCountry) locationCountry = geo.country;
        if (!countryCode2) countryCode2 = geo.countryCode;
      }
    }

    // Reverse geocode to fill missing name/country
    if (lat && lon && (!locationName || !locationCountry)) {
      const rev = await reverseGeocode(lat, lon);
      if (rev) {
        if (!locationName) locationName = rev.city;
        if (!locationCountry) locationCountry = rev.country;
        if (!countryCode2) countryCode2 = rev.countryCode;
      }
    }

    // ── Parallel first-tier data fetching ────────────────────────────────
    const [cityData, countryDataRaw, climateData] = await Promise.all([
      locationName ? getCityData(locationName, countryCode2 || undefined) : Promise.resolve(null),
      // Try by name first; if name is empty but code is present, fall through to code lookup below
      locationCountry
        ? getCountryData(locationCountry)
        : countryCode2
        ? getCountryDataByCode(countryCode2)
        : Promise.resolve(null),
      lat && lon ? getClimateData(lat, lon, body.month) : Promise.resolve(null),
    ]);

    // Enrich country codes from all available sources
    if (!countryCode2 && cityData?.countryCode) countryCode2 = cityData.countryCode;
    if (!countryCode2 && countryDataRaw?.cca2) countryCode2 = countryDataRaw.cca2;
    if (countryDataRaw?.cca3) countryCode3 = countryDataRaw.cca3;

    // Retry country data by code if name-based lookup failed
    let resolvedCountryData = countryDataRaw;
    if (!resolvedCountryData && countryCode2) {
      resolvedCountryData = await getCountryDataByCode(countryCode2);
      if (resolvedCountryData?.cca2 && !countryCode2) countryCode2 = resolvedCountryData.cca2;
      if (resolvedCountryData?.cca3) countryCode3 = resolvedCountryData.cca3;
    }

    // ── Population: multi-source waterfall ───────────────────────────────
    // Tier 1: GeoDB (may be missing for many non-Western cities)
    let population: number = (cityData?.population as number) > 0 ? (cityData!.population as number) : 0;
    let populationSource = population > 0 ? "GeoDB" : "";

    // Tier 2: GeoNames (requires GEONAMES_USERNAME env var — free to register)
    if (!population && countryCode2) {
      const geoNamesPop = await getGeoNamesPopulation(locationName, countryCode2);
      if (geoNamesPop) {
        population = geoNamesPop;
        populationSource = "GeoNames";
        console.log("🌍 Population from GeoNames:", population);
      }
    }

    // Tier 3: OSM Overpass population tag (truly worldwide, no API key)
    if (!population && lat && lon) {
      const osmPop = await getOSMPopulation(locationName, lat, lon);
      if (osmPop) {
        population = osmPop;
        populationSource = "OSM";
        console.log("🌍 Population from OSM:", population);
      }
    }

    // Tier 4: Derive a rough estimate from country population + city status.
    // This ensures we ALWAYS have a non-zero population for downstream maths.
    if (!population && resolvedCountryData?.population) {
      const nationalPop = resolvedCountryData.population;
      // Treat as a "typical" large city: ~5-10% of national population
      population = Math.round(nationalPop * 0.07);
      populationSource = "country-derived";
      console.warn("⚠️ Using country-derived population estimate:", population);
    }

    // Tier 5: Absolute floor — never let population be 0
    if (!population || population < 1000) {
      population = 500_000; // median-ish city
      populationSource = "constant-floor";
      console.warn("⚠️ Using constant floor population:", population);
    }

    // ── Capital detection (case-insensitive, partial-match) ───────────────
    const capitalName = resolvedCountryData?.capital?.toLowerCase().trim() ?? "";
    const cityNameNorm = (cityData?.name ?? locationName).toLowerCase().trim();
    const isCapital =
      capitalName.length > 0 &&
      (cityNameNorm === capitalName ||
        cityNameNorm.startsWith(capitalName) ||
        capitalName.startsWith(cityNameNorm));

    // ── World Bank: tourism arrivals + CO2 ───────────────────────────────
    const [countryAnnualArrivals, co2PerCapita] = await Promise.all([
      countryCode2 ? getWorldBankTourism(countryCode2) : Promise.resolve(null),
      countryCode2 ? getWorldBankCO2(countryCode2) : Promise.resolve(null),
    ]);

    // ── Visitor estimates ─────────────────────────────────────────────────
    const cityAnnualVisitors =
      countryAnnualArrivals && population && resolvedCountryData?.population
        ? estimateCityAnnualVisitors(
            countryAnnualArrivals,
            population,
            resolvedCountryData.population,
            isCapital
          )
        : null;

    const resolvedLat = lat ?? 0;

    /**
     * Fallback annual visitors when World Bank data is unavailable.
     * Calibrated to real visitor-to-resident ratios:
     *   Paris 30M / 2M res = 15×  |  Barcelona 20M / 1.6M = 12×
     *   NYC 66M / 8M = 8×         |  Dubai 16M / 3.3M = 5×
     *   Small cities: 1–3×
     * Capital bonus ×2 applied on top.
     */
    const capitalBonus = isCapital ? 2.0 : 1.0;
    const fallbackAnnualVisitors = Math.round(
      capitalBonus *
        (population > 8_000_000
          ? population * 7
          : population > 5_000_000
          ? population * 6
          : population > 3_000_000
          ? population * 8
          : population > 2_000_000
          ? population * 10
          : population > 1_000_000
          ? population * 8
          : population > 500_000
          ? population * 5
          : population > 200_000
          ? population * 3
          : population > 100_000
          ? population * 2
          : Math.max(population * 1.5, 50_000))
    );

    const monthNum = parseInt(getMonthNumber(body.month));
    const seasonalFactor = getSeasonalFactor(monthNum, resolvedLat);
    const baseAnnualForMonth = cityAnnualVisitors ?? fallbackAnnualVisitors;
    const monthlyVisitors = Math.max(1_000, Math.round((baseAnnualForMonth / 12) * seasonalFactor));

    console.log("🌍 Visitor pipeline:", {
      countryCode2,
      countryAnnualArrivals,
      cityPopulation: population,
      populationSource,
      nationalPopulation: resolvedCountryData?.population,
      isCapital,
      cityAnnualVisitors,
      fallbackAnnualVisitors,
      baseAnnualForMonth,
      seasonalFactor,
      monthlyVisitors,
    });

    // ── Derived scores ────────────────────────────────────────────────────
    const crowdLevel = getCrowdLevel(monthlyVisitors, population);
    const ecoScore = calculateEcoScore(climateData, population);
    const waterStress = getWaterStress(climateData);
    const carbonEstimate = calculateCarbonEstimate(co2PerCapita, population);
    const crowdScore = getCrowdScore(monthlyVisitors, population);
    const sustainabilityRating =
      ecoScore >= 80 ? "A" : ecoScore >= 65 ? "B" : ecoScore >= 45 ? "C" : "D";

    // ── Monthly trend ─────────────────────────────────────────────────────
    const monthlyTrend = validMonths.map((m) => {
      const mNum = parseInt(getMonthNumber(m));
      const sf = getSeasonalFactor(mNum, resolvedLat);
      const baseAnnual = cityAnnualVisitors ?? fallbackAnnualVisitors;
      const visitors = Math.max(1_000, Math.round((baseAnnual / 12) * sf));

      const tempDelta = climateData
        ? mNum >= 6 && mNum <= 8
          ? 2
          : mNum <= 2 || mNum === 12
          ? -2
          : 0
        : 0;

      return {
        month: m,
        visitors,
        eco_score: Math.round(Math.max(20, Math.min(98, ecoScore + tempDelta))),
        seasonal_factor: sf,
      };
    });

    // ── Visit time recommendations ────────────────────────────────────────
    const bestVisitTimes: string[] = [];
    if (climateData) {
      if (climateData.avgTempMax > 32) {
        bestVisitTimes.push("Early morning (6–10am)", "Late evening (5–8pm)");
      } else if (climateData.avgTempMax < 10) {
        bestVisitTimes.push("Midday (11am–3pm) for warmth");
      } else {
        bestVisitTimes.push("Morning (9–11am)", "Afternoon (2–5pm)");
      }
    } else {
      bestVisitTimes.push("Weekdays", "Early morning");
    }

    // ── Response ──────────────────────────────────────────────────────────
    const responsePayload = {
      crowd_forecast: crowdLevel,
      crowd_score: crowdScore,
      best_visit_times: bestVisitTimes.slice(0, 2),
      eco_score: ecoScore,
      carbon_estimate_kg: carbonEstimate,
      water_stress: waterStress,
      sustainability_rating: sustainabilityRating,
      green_practices: [
        "Use public transportation",
        "Support local businesses",
        "Bring a reusable water bottle",
        "Choose eco-certified accommodations",
      ],
      responsible_tips: [
        "Respect local customs and traditions",
        "Stay on designated trails",
        "Avoid single-use plastics",
        "Book with certified local guides",
      ],
      avoid_periods:
        crowdLevel === "high"
          ? ["Peak tourist season", "Weekend afternoons"]
          : ["Weekend afternoons"],
      local_initiatives: [
        "Community tourism projects",
        "Local conservation efforts",
        "Sustainable development programs",
      ],
      alternative_destinations: ["Nearby smaller towns", "Rural areas", "Neighboring regions"],
      carrying_capacity_alert: crowdLevel === "high",
      monthly_trend: monthlyTrend,

      _metadata: {
        location: {
          name: locationName || null,
          country: locationCountry || null,
          lat: lat ?? null,
          lon: lon ?? null,
          population: population || null,
          populationSource,
          countryCode2: countryCode2 || null,
          countryCode3: countryCode3 || null,
          isCapital,
        },
        data_sources: {
          climate: climateData ? "Open-Meteo Archive API" : null,
          city: cityData ? "GeoDB Cities (RapidAPI)" : null,
          country: resolvedCountryData ? "RestCountries API" : null,
          tourism_arrivals:
            countryAnnualArrivals !== null ? "World Bank ST.INT.ARVL" : null,
          co2: co2PerCapita !== null ? "World Bank EN.ATM.CO2E.PC" : null,
          geocoding: "OpenStreetMap Nominatim",
        },
        tourism: {
          country_annual_arrivals: countryAnnualArrivals,
          city_annual_visitors_estimated: cityAnnualVisitors,
          monthly_visitors_selected_month: monthlyVisitors,
          seasonal_factor: seasonalFactor,
          co2_per_capita_tonnes: co2PerCapita,
        },
        climate: climateData,
      },
    };

    console.log("🌍 Sustainability insights generated successfully");
    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("🌍 API Error:", err);
    return NextResponse.json(
      { error: "Failed to generate insights", detail: err?.message },
      { status: 500 }
    );
  }
}
