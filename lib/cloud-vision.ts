import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialiser le client Vision
let visionClient: ImageAnnotatorClient | null = null;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    visionClient = new ImageAnnotatorClient();
    console.log('✅ Google Cloud Vision initialized');
  } else {
    console.warn('⚠️ Google Cloud Vision credentials not found');
  }
} catch (error) {
  console.error('❌ Failed to initialize Google Cloud Vision:', error);
}

export interface VisionAnalysisResult {
  labels: Array<{ description: string; score: number }>;
  landmarks: Array<{ description: string; score: number; locations?: any[] }>;
  text?: string;
  safeSearch?: any;
  colors?: any[];
  faces?: number;
  webEntities?: Array<{ description: string; score: number }>;
  fullResponse?: any;
}

export async function analyzeImage(imageBuffer: Buffer): Promise<VisionAnalysisResult> {
  if (!visionClient) {
    throw new Error('Google Cloud Vision not initialized');
  }

  try {
    console.log('🔍 Analyzing image with Google Cloud Vision...');

    // Demander plusieurs fonctionnalités
    const [result] = await visionClient.annotateImage({
      image: { content: imageBuffer.toString('base64') },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 20 },
        { type: 'LANDMARK_DETECTION', maxResults: 10 },
        { type: 'TEXT_DETECTION' },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'SAFE_SEARCH_DETECTION' },
        { type: 'WEB_DETECTION', maxResults: 20 },
      ],
    });

    console.log('✅ Image analysis complete');

    // Extraire les informations pertinentes
    const labels = result.labelAnnotations?.map(label => ({
      description: label.description || '',
      score: label.score || 0
    })) || [];

    const landmarks = result.landmarkAnnotations?.map(landmark => ({
      description: landmark.description || '',
      score: landmark.score || 0,
      locations: landmark.locations
    })) || [];

    const webEntities = result.webDetection?.webEntities?.map(entity => ({
      description: entity.description || '',
      score: entity.score || 0
    })) || [];

    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors?.map(color => ({
      color: color.color,
      score: color.score,
      pixelFraction: color.pixelFraction
    })) || [];

    return {
      labels,
      landmarks,
      text: result.textAnnotations?.[0]?.description,
      safeSearch: result.safeSearchAnnotation,
      colors,
      faces: result.faceAnnotations?.length || 0,
      webEntities,
      fullResponse: result
    };

  } catch (error) {
    console.error('❌ Google Cloud Vision error:', error);
    throw error;
  }
}

// Fonction spécifique pour la reconnaissance de patrimoine
export async function recognizeHeritage(imageBuffer: Buffer, countryHint?: string) {
  const analysis = await analyzeImage(imageBuffer);
  
  // Chercher des landmarks (sites patrimoniaux)
  const landmarks = analysis.landmarks;
  const labels = analysis.labels;
  const webEntities = analysis.webEntities;

  // Si un landmark est détecté avec une bonne confiance
  if (landmarks.length > 0 && landmarks[0].score > 0.5) {
    return {
      site_name: landmarks[0].description,
      confidence: Math.round(landmarks[0].score * 100),
      type: 'landmark',
      details: landmarks[0]
    };
  }

  // Chercher dans les web entities (reconnaissance web)
  const relevantWebEntities = webEntities
    .filter(e => e.score > 0.5)
    .map(e => e.description);

  // Chercher des labels pertinents
  const heritageLabels = labels
    .filter(l => 
      l.score > 0.6 && (
        l.description.toLowerCase().includes('temple') ||
        l.description.toLowerCase().includes('mosque') ||
        l.description.toLowerCase().includes('ruins') ||
        l.description.toLowerCase().includes('monument') ||
        l.description.toLowerCase().includes('heritage') ||
        l.description.toLowerCase().includes('historical')
      )
    )
    .map(l => l.description);

  return {
    site_name: landmarks[0]?.description || heritageLabels[0] || 'Unknown heritage site',
    confidence: landmarks[0] ? Math.round(landmarks[0].score * 100) : 60,
    type: landmarks.length > 0 ? 'landmark' : 'label',
    labels: heritageLabels,
    web_entities: relevantWebEntities,
    all_labels: labels.slice(0, 10)
  };
}

// Fonction pour obtenir des informations détaillées
export async function getHeritageInfo(imageBuffer: Buffer, countryHint?: string) {
  try {
    const heritage = await recognizeHeritage(imageBuffer, countryHint);
    
    // Ici vous pourriez appeler votre base de données ou une API
    // pour obtenir plus d'informations sur le site identifié
    
    return {
      ...heritage,
      description: `Site patrimonial identifié : ${heritage.site_name}`,
      historical_context: "Informations historiques à compléter...",
      fun_facts: [
        "Ce site est classé au patrimoine mondial",
        "Il attire des milliers de visiteurs chaque année"
      ],
      visitor_tips: "Meilleure période pour visiter : printemps et automne",
      nearby_sites: ["Site 1", "Site 2"]
    };
  } catch (error) {
    console.error('Error getting heritage info:', error);
    throw error;
  }
}