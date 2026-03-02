import { NextRequest, NextResponse } from "next/server";


// 1. 🌤️ Open-Meteo - Real climate data (free, no key)
async function getClimateData(lat: number, lon: number, month: string) {
  try {
    const year = new Date().getFullYear();
    // Use previous year if current year month hasn't passed yet
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

    const maxTemps: number[] = data.daily.temperature_2m_max?.filter((v: number) => v !== null) ?? [];
    const minTemps: number[] = data.daily.temperature_2m_min?.filter((v: number) => v !== null) ?? [];
    const precipitations: number[] = data.daily.precipitation_sum?.filter((v: number) => v !== null) ?? [];
    const windSpeeds: number[] = data.daily.wind_speed_10m_max?.filter((v: number) => v !== null) ?? [];
    const et0: number[] = data.daily.et0_fao_evapotranspiration?.filter((v: number) => v !== null) ?? [];

    const totalPrecip = precipitations.reduce((a: number, b: number) => a + b, 0);
    const totalEt0 = et0.reduce((a: number, b: number) => a + b, 0);

    // Water stress index: if evapotranspiration >> precipitation → high stress
    const aridity = totalEt0 > 0 ? totalPrecip / totalEt0 : 1;

    return {
      avgTempMax: calculateAverage(maxTemps),
      avgTempMin: calculateAverage(minTemps),
      maxTemp: maxTemps.length ? Math.max(...maxTemps) : null,
      minTemp: minTemps.length ? Math.min(...minTemps) : null,
      totalPrecipitation: totalPrecip,
      avgWindSpeed: calculateAverage(windSpeeds),
      precipitationDays: precipitations.filter((p: number) => p > 0).length,
      aridityIndex: Math.round(aridity * 100) / 100, // <0.5 = arid, 0.5-1 = semi-arid, >1 = humid
    };
  } catch (error) {
    console.error("Error fetching climate data:", error);
    return null;
  }
}

// 2. 🏙️ GeoDB Cities via RapidAPI - City population & coordinates
async function getCityData(cityName: string, countryCode?: string) {
  try {
    const url = countryCode
      ? `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(cityName)}&countryIds=${encodeURIComponent(countryCode)}&limit=1&sort=-population`
      : `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(cityName)}&limit=5&sort=-population`;

    const response = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
        "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.data && data.data.length > 0) {
      const city = data.data[0];
      return {
        name: city.name,
        population: city.population,
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
    console.error("Error fetching city data:", error);
    return null;
  }
}

// 3. 🌍 RestCountries - Country metadata (free, no key)
async function getCountryData(countryName: string) {
  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`
    );

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

// 4. 🌐 World Bank API - Real country-level inbound tourism arrivals (free, no key)
// Indicator: ST.INT.ARVL = International tourism, number of arrivals
async function getWorldBankTourism(countryCode2: string): Promise<number | null> {
  try {
    // Fetch last 5 years and pick most recent non-null value
    const response = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode2}/indicator/ST.INT.ARVL?format=json&mrv=5&per_page=5`
    );

    if (!response.ok) return null;

    const data = await response.json();

    // World Bank returns [metadata, data_array]
    if (!Array.isArray(data) || data.length < 2) return null;

    const entries: Array<{ value: number | null; date: string }> = data[1];
    if (!entries) return null;

    for (const entry of entries) {
      if (entry.value !== null && entry.value > 0) {
        return entry.value; // Total annual inbound arrivals for the country
      }
    }

    return null;
  } catch (error) {
    console.error("World Bank tourism fetch error:", error);
    return null;
  }
}

// 5. 🌐 World Bank API - CO2 emissions per capita (kg per capita, tonnes → kg)
// Indicator: EN.ATM.CO2E.PC = CO2 emissions (metric tons per capita)
async function getWorldBankCO2(countryCode2: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://api.worldbank.org/v2/country/${countryCode2}/indicator/EN.ATM.CO2E.PC?format=json&mrv=5&per_page=5`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) return null;

    const entries: Array<{ value: number | null }> = data[1];
    for (const entry of entries) {
      if (entry.value !== null && entry.value > 0) {
        // Convert metric tons per capita → average per tourist visit (assume 7-day stay, ~1/52 of annual)
        // We'll return the raw value in tonnes; caller will derive tourist carbon
        return entry.value;
      }
    }

    return null;
  } catch (error) {
    console.error("World Bank CO2 fetch error:", error);
    return null;
  }
}

// 6. 🗺️ OpenStreetMap Nominatim - Geocoding (free, no key)
async function geocode(query: string): Promise<{ lat: number; lon: number; city: string; country: string; countryCode: string } | null> {
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
      city: address.city || address.town || address.village || address.suburb || result.display_name?.split(",")[0] || query,
      country: address.country || "",
      countryCode: address.country_code?.toUpperCase() || "",
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; country: string; countryCode: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      { headers: { "User-Agent": "Rihla-Tourism-App/1.0" } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const address = data.address || {};

    return {
      city: address.city || address.town || address.village || address.suburb || data.display_name?.split(",")[0] || "Unknown",
      country: address.country || "Unknown",
      countryCode: address.country_code?.toUpperCase() || "",
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

// ==============================================
// DERIVED METRICS (data-driven, no hardcoding)
// ==============================================

/**
 * Estimate city-level annual visitors from country-level World Bank arrivals.
 * Uses city's share of national population as a proxy for tourist distribution,
 * then adjusts for city size tiers (capital cities tend to capture more tourists).
 */
function estimateCityAnnualVisitors(
  countryArrivals: number,
  cityPopulation: number,
  nationalPopulation: number,
  isCapital: boolean
): number {
  if (!countryArrivals || !nationalPopulation) return 0;

  // Base share = city population fraction of national population
  let share = cityPopulation / nationalPopulation;

  // Tourism concentration factor: tourists cluster in cities more than residents
  // Large cities (>1M) see disproportionately more tourists
  let concentrationMultiplier = 1;
  if (cityPopulation > 5_000_000) concentrationMultiplier = 8;
  else if (cityPopulation > 2_000_000) concentrationMultiplier = 6;
  else if (cityPopulation > 1_000_000) concentrationMultiplier = 4;
  else if (cityPopulation > 500_000) concentrationMultiplier = 3;
  else if (cityPopulation > 100_000) concentrationMultiplier = 2;

  if (isCapital) concentrationMultiplier *= 1.5;

  const estimatedShare = Math.min(share * concentrationMultiplier, 0.5); // Cap at 50% of national arrivals
  return Math.round(countryArrivals * estimatedShare);
}

/**
 * Monthly seasonal factor based on hemisphere and climate.
 * Derived purely from latitude (no hardcoded city rules).
 */
function getSeasonalFactor(monthNum: number, lat: number): number {
  const isNorth = lat >= 0;

  // Northern hemisphere: peak Jun-Aug; Southern: peak Dec-Feb
  const summerMonths = isNorth ? [6, 7, 8] : [12, 1, 2];
  const shoulderMonths = isNorth ? [4, 5, 9, 10] : [3, 4, 10, 11];

  if (summerMonths.includes(monthNum)) return 1.5;
  if (shoulderMonths.includes(monthNum)) return 1.15;
  return 0.65;
}

type ClimateData = Awaited<ReturnType<typeof getClimateData>>;

/**
 * Eco score derived fully from real climate + population data.
 * No hardcoded base scores per city.
 */
function calculateEcoScore(climateData: ClimateData, population: number): number {
  let score = 70;

  if (climateData) {
    // Heat stress
    if (climateData.avgTempMax > 40) score -= 15;
    else if (climateData.avgTempMax > 35) score -= 10;
    else if (climateData.avgTempMax > 30) score -= 3;

    // Extreme cold stress
    if (climateData.avgTempMin < -10) score -= 10;
    else if (climateData.avgTempMin < 0) score -= 5;

    // Water availability (aridity index)
    if (climateData.aridityIndex < 0.2) score -= 15; // Very arid
    else if (climateData.aridityIndex < 0.5) score -= 8; // Semi-arid
    else if (climateData.aridityIndex > 2) score -= 3; // Too much rain

    // Rainfall diversity bonus
    if (climateData.precipitationDays > 15) score -= 5;
    else if (climateData.precipitationDays >= 5 && climateData.precipitationDays <= 12) score += 5;
  }

  // Population pressure
  if (population > 10_000_000) score -= 15;
  else if (population > 5_000_000) score -= 10;
  else if (population > 1_000_000) score -= 5;
  else if (population < 50_000) score += 10;
  else if (population < 200_000) score += 5;

  return Math.max(20, Math.min(98, Math.round(score)));
}

/**
 * Water stress derived from aridity index (real climate data).
 */
function getWaterStress(climateData: ClimateData): "low" | "moderate" | "high" {
  if (!climateData) return "moderate";

  const { aridityIndex, totalPrecipitation } = climateData;

  if (aridityIndex < 0.3 || totalPrecipitation < 20) return "high";
  if (aridityIndex < 0.65 || totalPrecipitation < 60) return "moderate";
  return "low";
}

/**
 * Carbon estimate per tourist visit derived from:
 * - Country's CO2 per capita (World Bank, tonnes/year)
 * - Average stay of 7 days = 7/365 of annual emissions
 * - Tourism overhead multiplier (~1.5x vs resident daily footprint)
 */
function calculateCarbonEstimate(co2PerCapitaTonnes: number | null, population: number): number {
  if (co2PerCapitaTonnes && co2PerCapitaTonnes > 0) {
    const dailyTonnes = co2PerCapitaTonnes / 365;
    const perVisitTonnes = dailyTonnes * 7 * 1.5; // 7-day stay, tourist overhead
    const kg = Math.round(perVisitTonnes * 1000 * 10) / 10; // → kg, 1 decimal
    return Math.max(1, kg); // always at least 1 kg
  }

  // Fallback: population-density proxy (no hardcoded city names)
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
  // Crowd pressure = visitors relative to city's absorptive capacity
  if (!cityPopulation || !monthlyVisitors) return "low";
  const ratio = monthlyVisitors / cityPopulation;

  if (ratio > 0.3 || monthlyVisitors > 1_500_000) return "high";
  if (ratio > 0.1 || monthlyVisitors > 300_000) return "moderate";
  return "low";
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
      return NextResponse.json({ error: "Invalid month. Use three-letter abbreviation (e.g. Jan)" }, { status: 400 });
    }

    if (!body.name && !body.country && (!body.lat || !body.lon)) {
      return NextResponse.json({ error: "Missing location information" }, { status: 400 });
    }

    // ── Location resolution ──────────────────────────────────────────────
    let locationName: string = body.name || "";
    let locationCountry: string = body.country || "";
    let lat: number | null = body.lat ?? null;
    let lon: number | null = body.lon ?? null;
    let countryCode2 = ""; // ISO 2-letter
    let countryCode3 = ""; // ISO 3-letter (for World Bank if needed)

    // Forward geocode if no coordinates
    if ((!lat || !lon) && locationName) {
      const geo = await geocode(`${locationName}${locationCountry ? ", " + locationCountry : ""}`);
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
        if (!locationName) locationName = geo.city;
        if (!locationCountry) locationCountry = geo.country;
        if (!countryCode2) countryCode2 = geo.countryCode;
      }
    }

    // Reverse geocode if no name
    if (lat && lon && (!locationName || !locationCountry)) {
      const rev = await reverseGeocode(lat, lon);
      if (rev) {
        if (!locationName) locationName = rev.city;
        if (!locationCountry) locationCountry = rev.country;
        if (!countryCode2) countryCode2 = rev.countryCode;
      }
    }

    // ── Parallel data fetching ───────────────────────────────────────────
    const [cityData, countryData, climateData] = await Promise.all([
      locationName ? getCityData(locationName, countryCode2 || undefined) : Promise.resolve(null),
      locationCountry ? getCountryData(locationCountry) : Promise.resolve(null),
      lat && lon ? getClimateData(lat, lon, body.month) : Promise.resolve(null),
    ]);

    // Enrich location metadata from API results
    const population: number = cityData?.population ?? 0;
    if (!countryCode2 && cityData?.countryCode) countryCode2 = cityData.countryCode;
    if (!countryCode2 && countryData?.cca2) countryCode2 = countryData.cca2;
    if (countryData?.cca3) countryCode3 = countryData.cca3;

    const isCapital =
      countryData?.capital?.toLowerCase() === locationName?.toLowerCase();

    // ── World Bank: tourism arrivals + CO2 (free, no key) ────────────────
    const [countryAnnualArrivals, co2PerCapita] = await Promise.all([
      countryCode2 ? getWorldBankTourism(countryCode2) : Promise.resolve(null),
      countryCode2 ? getWorldBankCO2(countryCode2) : Promise.resolve(null),
    ]);

    // ── Visitor estimates ─────────────────────────────────────────────────
    const cityAnnualVisitors =
      countryAnnualArrivals && population && countryData?.population
        ? estimateCityAnnualVisitors(countryAnnualArrivals, population, countryData.population, isCapital)
        : null;

    // Safe hemisphere reference (defaults to northern if unknown)
    const resolvedLat = lat ?? 0;

    // Fallback annual visitors when World Bank has no data for this country
    const fallbackAnnualVisitors = population
      ? Math.round(population * (population > 2_000_000 ? 0.4 : population > 500_000 ? 0.25 : 0.1))
      : 50_000;

    const monthNum = parseInt(getMonthNumber(body.month));
    const seasonalFactor = getSeasonalFactor(monthNum, resolvedLat);
    const baseAnnualForMonth = cityAnnualVisitors ?? fallbackAnnualVisitors;
    const monthlyVisitors = Math.max(100, Math.round((baseAnnualForMonth / 12) * seasonalFactor));

    // ── Derived scores ────────────────────────────────────────────────────
    const crowdLevel = getCrowdLevel(monthlyVisitors ?? 0, population);
    const ecoScore = calculateEcoScore(climateData, population);
    const waterStress = getWaterStress(climateData);
    const carbonEstimate = calculateCarbonEstimate(co2PerCapita, population);
    const crowdScore = crowdLevel === "high" ? 85 : crowdLevel === "moderate" ? 55 : 25;
    const sustainabilityRating = ecoScore >= 80 ? "A" : ecoScore >= 65 ? "B" : ecoScore >= 45 ? "C" : "D";

    // ── Monthly trend ─────────────────────────────────────────────────────
    // Recharts drops null datapoints, so visitors must always be a number.
    const monthlyTrend = validMonths.map((m) => {
      const mNum = parseInt(getMonthNumber(m));
      const sf = getSeasonalFactor(mNum, resolvedLat);
      const baseAnnual = cityAnnualVisitors ?? fallbackAnnualVisitors;
      const visitors = Math.max(100, Math.round((baseAnnual / 12) * sf));

      // Eco score shifts slightly with climate seasons
      const tempDelta = climateData
        ? (mNum >= 6 && mNum <= 8 ? 2 : mNum <= 2 || mNum === 12 ? -2 : 0)
        : 0;

      return {
        month: m,
        visitors,
        eco_score: Math.round(Math.max(20, Math.min(98, ecoScore + tempDelta))),
        seasonal_factor: sf,
      };
    });

    // ── Visit time recommendations (climate-driven) ───────────────────────
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

    // ── Response ─────────────────────────────────────────────────────────
    const response = {
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
      avoid_periods: crowdLevel === "high" ? ["Peak tourist season", "Weekend afternoons"] : ["Weekend afternoons"],
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
          countryCode2: countryCode2 || null,
          countryCode3: countryCode3 || null,
          isCapital,
        },
        data_sources: {
          climate: climateData ? "Open-Meteo Archive API" : null,
          city: cityData ? "GeoDB Cities (RapidAPI)" : null,
          country: countryData ? "RestCountries API" : null,
          tourism_arrivals: countryAnnualArrivals !== null ? "World Bank ST.INT.ARVL" : null,
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
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("🌍 API Error:", error);
    return NextResponse.json({ error: "Failed to generate insights", detail: error?.message }, { status: 500 });
  }
}
