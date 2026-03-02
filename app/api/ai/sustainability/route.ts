import { NextRequest, NextResponse } from "next/server";

// Fonction pour obtenir des données climatiques réelles (Open-Meteo - gratuit, sans clé)
async function getClimateData(lat: number, lon: number, month: string) {
  try {
    // Obtenir l'année courante
    const year = new Date().getFullYear();
    const monthNum = getMonthNumber(month);
    
    // Calculer les dates de début et fin du mois
    const startDate = `${year}-${monthNum}-01`;
    const endDate = `${year}-${monthNum}-28`; // Utiliser le 28 pour éviter les problèmes de fin de mois
    
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
    );
    
    if (response.ok) {
      const data = await response.json();
      const maxTemps = data.daily?.temperature_2m_max || [];
      const precipitations = data.daily?.precipitation_sum || [];
      
      return {
        avgTemp: calculateAverage(maxTemps),
        maxTemp: Math.max(...maxTemps),
        minTemp: Math.min(...data.daily?.temperature_2m_min || []),
        precipitation: precipitations.reduce((a: number, b: number) => a + b, 0) / (precipitations.length || 1)
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching climate data:", error);
    return null;
  }
}

// Fonction pour obtenir des données de ville via RapidAPI GeoDB
async function getCityData(cityName: string, country: string) {
  try {
    const response = await fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(cityName)}&countryIds=${encodeURIComponent(country)}&limit=1&sort=-population`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '9d3f8eb416mshbafa3e0b20a3e8cp1e4589jsna13077ec3dbd',
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const city = data.data[0];
        return {
          population: city.population,
          elevation: city.elevation,
          latitude: city.latitude,
          longitude: city.longitude,
          countryCode: city.countryCode
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching city data:", error);
    return null;
  }
}

// Fonction pour obtenir des données de pays
async function getCountryData(countryCode: string) {
  try {
    const response = await fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/countries/${countryCode}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '9d3f8eb416mshbafa3e0b20a3e8cp1e4589jsna13077ec3dbd',
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        name: data.data?.name,
        currencyCode: data.data?.currencyCodes?.[0],
        population: data.data?.population
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching country data:", error);
    return null;
  }
}

// Fonctions helpers
function getMonthNumber(month: string): string {
  const months: Record<string, string> = {
    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
    "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
    "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12"
  };
  return months[month] || "01";
}

function calculateAverage(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10;
}

function getTouristSeason(country: string, month: string): "peak" | "shoulder" | "off" {
  const northernHemisphere = ["USA", "CAN", "FRA", "ITA", "ESP", "GBR", "DEU", "JPN", "KOR", "CHN"];
  const southernHemisphere = ["AUS", "NZL", "ZAF", "ARG", "CHL", "BRA", "PER"];
  const tropical = ["THA", "VNM", "IDN", "MYS", "PHL", "IND", "MEX", "CRI", "KEN", "TZA"];
  
  const monthNum = parseInt(getMonthNumber(month));
  
  if (tropical.includes(country)) {
    // Saison sèche = haute saison
    if ([11, 12, 1, 2, 3].includes(monthNum)) return "peak";
    if ([4, 5, 10].includes(monthNum)) return "shoulder";
    return "off";
  }
  
  if (southernHemisphere.includes(country)) {
    // Été = décembre-février = haute saison
    if ([12, 1, 2].includes(monthNum)) return "peak";
    if ([11, 3, 4].includes(monthNum)) return "shoulder";
    return "off";
  }
  
  // Hémisphère nord - été = juin-août = haute saison
  if ([6, 7, 8].includes(monthNum)) return "peak";
  if ([5, 9, 10].includes(monthNum)) return "shoulder";
  return "off";
}

function calculateCrowdScore(season: "peak" | "shoulder" | "off"): number {
  switch(season) {
    case "peak": return 85;
    case "shoulder": return 55;
    case "off": return 25;
  }
}

function calculateEcoScore(climateData: any, population: number = 100000): number {
  let score = 70; // Score de base
  
  if (climateData) {
    // Ajuster basé sur la température (les températures extrêmes réduisent le score)
    if (climateData.avgTemp > 30) score -= 10;
    if (climateData.avgTemp < 5) score -= 15;
    if (climateData.avgTemp > 35) score -= 20;
    
    // Ajuster basé sur les précipitations
    if (climateData.precipitation > 200) score -= 15;
    if (climateData.precipitation < 20) score -= 10; // Sécheresse
  }
  
  // Impact de la population
  if (population > 5000000) score -= 15;
  else if (population > 1000000) score -= 10;
  else if (population > 500000) score -= 5;
  else if (population < 100000) score += 5;
  
  return Math.max(30, Math.min(95, Math.round(score)));
}

function calculateWaterStress(precipitation: number): "low" | "moderate" | "high" {
  if (precipitation > 150) return "low";
  if (precipitation > 60) return "moderate";
  return "high";
}

function calculateCarbonEstimate(population: number): number {
  // Estimation basée sur la population (kg CO2 par visiteur)
  if (population > 5000000) return 25;
  if (population > 1000000) return 18;
  if (population > 500000) return 12;
  if (population > 100000) return 8;
  return 5;
}

function getSustainabilityRating(score: number): string {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 45) return "C";
  return "D";
}

function getGreenPractices(country: string): string[] {
  const practices: Record<string, string[]> = {
    "France": ["Take high-speed trains (TGV) between cities", "Support local farmers markets", "Stay in eco-labelled hotels", "Use bike-sharing systems"],
    "Italy": ["Walk or bike in historic centers", "Avoid single-use plastics", "Eat at farm-to-table restaurants", "Visit during shoulder season"],
    "Spain": ["Use public transportation", "Respect siesta hours", "Choose sustainable accommodations", "Support local artisans"],
    "Thailand": ["Say no to elephant rides", "Use reef-safe sunscreen", "Support marine conservation", "Eat at local markets"],
    "Japan": ["Use Japan Rail Pass", "Respect recycling rules", "Stay in eco-friendly ryokans", "Avoid over-touristed spots"],
    "USA": ["Use public transit in cities", "Support National Parks", "Choose LEED-certified hotels", "Reduce energy consumption"],
    "default": ["Use public transport", "Support local businesses", "Bring reusable water bottle", "Minimize plastic waste"]
  };
  return practices[country] || practices.default;
}

function getResponsibleTips(country: string): string[] {
  const tips: Record<string, string[]> = {
    "France": ["Learn basic French phrases", "Respect quiet hours (12-2pm)", "Separate your recycling", "Visit popular sites early"],
    "Italy": ["Cover up in churches", "Avoid peak hours at popular sites", "Book tickets in advance", "Respect local dining customs"],
    "Spain": ["Embrace the siesta culture", "Dine late like locals", "Learn Spanish greetings", "Respect beach flags"],
    "Thailand": ["Dress modestly at temples", "Remove shoes when entering homes", "Never touch a monk", "Haggle respectfully"],
    "Japan": ["Bow when greeting", "Remove shoes indoors", "Don't tip", "Follow queue etiquette"],
    "USA": ["Tip service workers (15-20%)", "Be mindful of personal space", "Reserve popular sites early", "Check local regulations"],
    "default": ["Respect local customs", "Minimize waste", "Stay on marked trails", "Ask before taking photos"]
  };
  return tips[country] || tips.default;
}

function getAvoidPeriods(season: "peak" | "shoulder" | "off"): string[] {
  const periods = [];
  
  if (season === "peak") {
    periods.push("Peak tourist season (high crowds)");
  }
  
  periods.push("Weekend afternoons (busiest times)");
  periods.push("Public holidays (if you prefer quiet)");
  
  return periods;
}

function getLocalInitiatives(country: string): string[] {
  const initiatives: Record<string, string[]> = {
    "France": ["Paris Respire (car-free days)", "Plages sans plastique", "Reforestation projects", "Villes et Villages Fleuris"],
    "Italy": ["Plastic Free Mediterranean", "Albergo Diffuso (sustainable hospitality)", "Slow Food movement", "Parks of Music"],
    "Spain": ["Green Spain initiative", "Sustainable Beaches program", "Rural tourism development", "Solar energy projects"],
    "Thailand": ["Marine conservation projects", "Elephant sanctuary programs", "Beach cleanup initiatives", "Zero-waste islands"],
    "Japan": ["Satoyama conservation", "Eco-tourism certification", "Traditional craft preservation", "Renewable energy push"],
    "USA": ["National Park conservation", "Leave No Trace program", "Local food movements", "Green building initiatives"],
    "default": ["Local conservation project", "Community tourism program", "Waste reduction initiative", "Wildlife protection"]
  };
  return initiatives[country] || initiatives.default;
}

function getAlternatives(country: string): string[] {
  const alternatives: Record<string, string[]> = {
    "France": ["Lyon instead of Paris", "Bordeaux wine country instead of Provence", "Strasbourg instead of Nice", "Dordogne instead of Loire Valley"],
    "Italy": ["Bologna instead of Florence", "Turin instead of Milan", "Lecce instead of Rome", "Umbria instead of Tuscany"],
    "Spain": ["Valencia instead of Barcelona", "Bilbao instead of Madrid", "Galicia instead of Costa del Sol", "Extremadura instead of Andalusia"],
    "Thailand": ["Krabi instead of Phuket", "Pai instead of Chiang Mai", "Koh Lanta instead of Koh Samui", "Isaan region instead of Bangkok"],
    "Japan": ["Kanazawa instead of Kyoto", "Fukuoka instead of Tokyo", "Hokkaido instead of Osaka", "Shikoku instead of Hiroshima"],
    "USA": ["Portland instead of Seattle", "Austin instead of Houston", "Savannah instead of Charleston", "Santa Fe instead of Phoenix"],
    "default": ["Nearby less-visited city", "Smaller neighboring town", "Rural countryside", "Off-season destinations"]
  };
  return alternatives[country] || alternatives.default;
}

function generateMonthlyTrend(country: string): any[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return months.map((month) => {
    const season = getTouristSeason(country, month);
    let visitors = 1000;
    let ecoScore = 75;
    
    switch(season) {
      case "peak":
        visitors = 5000 + Math.floor(Math.random() * 2000);
        ecoScore = 45 + Math.floor(Math.random() * 15);
        break;
      case "shoulder":
        visitors = 2500 + Math.floor(Math.random() * 1500);
        ecoScore = 60 + Math.floor(Math.random() * 15);
        break;
      case "off":
        visitors = 800 + Math.floor(Math.random() * 700);
        ecoScore = 70 + Math.floor(Math.random() * 20);
        break;
    }
    
    return {
      month,
      visitors: Math.round(visitors),
      eco_score: Math.round(ecoScore)
    };
  });
}

// Fonction principale
export async function POST(req: NextRequest) {
  console.log("🌍 Sustainability API: Received request");
  
  try {
    const body = await req.json();
    console.log("🌍 Request body:", body);

    // Validate input
    if (!body.month) {
      return NextResponse.json(
        { error: "Missing required field: month is required" },
        { status: 400 }
      );
    }

    // Validate month
    const validMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (!validMonths.includes(body.month)) {
      return NextResponse.json(
        { error: "Invalid month. Must be three-letter abbreviation (e.g., Jan, Feb)" },
        { status: 400 }
      );
    }

    // Check if we have location info
    if (!body.name && !body.country && (!body.lat || !body.lon)) {
      return NextResponse.json(
        { error: "Missing location information. Provide either (name and country) or (lat and lon)" },
        { status: 400 }
      );
    }

    // Get location info
    let locationName = body.name;
    let locationCountry = body.country;
    let lat = body.lat;
    let lon = body.lon;
    let countryCode = "";
    let population = 100000;

    // If lat/lon provided but no name/country, reverse geocode
    if (body.lat && body.lon && (!body.name || !body.country)) {
      try {
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${body.lat}&lon=${body.lon}&zoom=18&addressdetails=1`,
          {
            headers: { 'User-Agent': 'Rihla-Tourism-App/1.0' }
          }
        );
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          const address = geoData.address || {};
          
          locationName = address.city || address.town || address.village || address.suburb || geoData.display_name?.split(',')[0] || "Unknown";
          locationCountry = address.country || "Unknown";
          countryCode = address.country_code?.toUpperCase() || "";
          lat = body.lat;
          lon = body.lon;
        }
      } catch (geoError) {
        console.error("🌍 Reverse geocoding error:", geoError);
      }
    }

    // Get city data from RapidAPI if we have a valid location
    if (locationName && locationCountry && locationName !== "Unknown") {
      try {
        const cityData = await getCityData(locationName, locationCountry);
        if (cityData) {
          population = cityData.population || population;
          countryCode = cityData.countryCode || countryCode;
        }
      } catch (error) {
        console.error("Error fetching city data:", error);
      }
    }

    // Get climate data if coordinates are available
    let climateData = null;
    if (lat && lon) {
      climateData = await getClimateData(lat, lon, body.month);
    }

    // Determine tourist season
    const season = getTouristSeason(countryCode || locationCountry, body.month);
    const crowdScore = calculateCrowdScore(season);

    // Calculate eco score
    const ecoScore = calculateEcoScore(climateData, population);

    // Calculate water stress
    const waterStress = climateData 
      ? calculateWaterStress(climateData.precipitation)
      : "moderate";

    // Generate insights
    const insights = {
      crowd_forecast: season === "peak" ? "high" : season === "shoulder" ? "moderate" : "low",
      crowd_score: crowdScore,
      best_visit_times: climateData?.avgTemp 
        ? climateData.avgTemp > 25 
          ? ["Early morning (7-10am) - Avoid heat", "Late afternoon (4-7pm) - Cooler temperatures"]
          : ["Midday (11am-2pm) - Best temperature", "Early morning - Peaceful atmosphere"]
        : ["Weekdays - Less crowded", "Early morning - Best light"],
      eco_score: ecoScore,
      carbon_estimate_kg: calculateCarbonEstimate(population),
      water_stress: waterStress,
      sustainability_rating: getSustainabilityRating(ecoScore),
      green_practices: getGreenPractices(locationCountry),
      responsible_tips: getResponsibleTips(locationCountry),
      avoid_periods: getAvoidPeriods(season),
      local_initiatives: getLocalInitiatives(locationCountry),
      alternative_destinations: getAlternatives(locationCountry),
      carrying_capacity_alert: season === "peak",
      monthly_trend: generateMonthlyTrend(locationCountry)
    };

    console.log("🌍 Sustainability insights generated successfully");
    
    return NextResponse.json({
      ...insights,
      location: {
        name: locationName,
        country: locationCountry,
        lat: lat,
        lon: lon,
        population: population,
        season: season
      }
    });

  } catch (error: any) {
    console.error("🌍 Sustainability API Error:", error);
    
    return NextResponse.json(
      { error: "Failed to generate sustainability insights" },
      { status: 500 }
    );
  }
}
