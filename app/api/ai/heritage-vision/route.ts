// app/api/ai/heritage-vision/route.ts (version simplifiée)
import { NextRequest, NextResponse } from "next/server";
import { ImageAnnotatorClient } from '@google-cloud/vision';

const visionClient = new ImageAnnotatorClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Détection multiple
    const [result] = await visionClient.annotateImage({
      image: { content: buffer.toString('base64') },
      features: [
        { type: 'LANDMARK_DETECTION' },
        { type: 'LABEL_DETECTION' },
        { type: 'WEB_DETECTION' },
      ],
    });

    // Extraire les informations
    const landmark = result.landmarkAnnotations?.[0];
    const labels = result.labelAnnotations?.slice(0, 5).map(l => l.description);
    const webEntities = result.webDetection?.webEntities?.slice(0, 5).map(e => e.description);

    if (landmark) {
      return NextResponse.json({
        site_name: landmark.description,
        confidence: Math.round((landmark.score || 0) * 100),
        description: `Site identifié : ${landmark.description}`,
        labels,
        webEntities
      });
    }

    return NextResponse.json({
      site_name: "Site non identifié",
      description: "Je n'ai pas reconnu ce site spécifiquement.",
      labels,
      webEntities
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}