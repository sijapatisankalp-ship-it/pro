
import { GoogleGenAI, Type } from "@google/genai";
import { ProductAnalysis } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeProductImage = async (base64Image: string): Promise<ProductAnalysis> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        {
          text: "Analyze this product image. Identify the product name, type, key materials, primary colors, and its likely target audience. Output this as a JSON object.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          productName: { type: Type.STRING },
          productType: { type: Type.STRING },
          materials: { type: Type.ARRAY, items: { type: Type.STRING } },
          primaryColors: { type: Type.ARRAY, items: { type: Type.STRING } },
          targetAudience: { type: Type.STRING },
        },
        required: ["productName", "productType", "materials", "primaryColors", "targetAudience"],
      },
    },
  });

  return JSON.parse(response.text || '{}');
};

export const generateLifestyleImage = async (base64Image: string, analysis: ProductAnalysis): Promise<string> => {
  const ai = getAI();
  const prompt = `Professional e-commerce lifestyle photography. Place the ${analysis.productName} (${analysis.productType}) prominently in a high-end, aspirational environment. 
  Settings: Use soft cinematic lighting, depth of field, and a modern aesthetic. 
  The environment should complement its materials (${analysis.materials.join(', ')}) and colors (${analysis.primaryColors.join(', ')}). 
  Ensure the product looks sharp and integrated into the scene. 
  NO text, NO logos, NO distorted features. High resolution.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const generateProductVideo = async (
  base64Image: string, 
  analysis: ProductAnalysis,
  onStatusUpdate: (status: string) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `A professional 1080p commercial video showcasing ${analysis.productName}. The camera moves in a smooth cinematic orbit around the product. Soft studio lighting highlights the ${analysis.materials.join(' and ')} textures. High-end lifestyle background matching ${analysis.primaryColors.join(' and ')} palette.`;

  onStatusUpdate("Initializing Video Engine...");
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    image: {
      imageBytes: base64Image.split(',')[1] || base64Image,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    }
  });

  const loadingMessages = [
    "Analyzing product geometry...",
    "Simulating cinematic lighting...",
    "Extrapolating lifestyle environment...",
    "Rendering high-fidelity frames...",
    "Applying professional color grade...",
    "Finalizing export bitrate..."
  ];
  let msgIdx = 0;

  while (!operation.done) {
    onStatusUpdate(loadingMessages[msgIdx % loadingMessages.length]);
    msgIdx++;
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed - no URI");

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const videoBlob = await response.blob();
  return URL.createObjectURL(videoBlob);
};

export const writeViralScript = async (analysis: ProductAnalysis): Promise<string> => {
  const ai = getAI();
  const prompt = `You are a viral TikTok marketing expert specializing in direct-to-consumer products. 
  Product: ${analysis.productName}
  Audience: ${analysis.targetAudience}
  Colors/Vibe: ${analysis.primaryColors.join(', ')}
  
  Write a high-energy 15-second script. 
  Structure:
  1. THE HOOK (0-3s): Stop the scroll with a relatable problem or shocking statement.
  2. THE VALUE (3-10s): Rapid-fire features using text-overlays. Mention the ${analysis.materials[0] || 'quality materials'}.
  3. THE CTA (10-15s): Urgency and clear instruction to buy.
  
  Use emojis, TikTok slang (e.g., 'Pov', 'Game changer', 'Obsessed'), and include [Visual Directions] in brackets.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
  });

  return response.text || "Failed to generate script.";
};

export const ideateBRoll = async (analysis: ProductAnalysis): Promise<string[]> => {
  const ai = getAI();
  const prompt = `Generate three highly descriptive 5-second B-roll scene prompts for an AI video generator like Veo. 
  Focus on the textures and details of the ${analysis.productName}. 
  Scene 1: Close-up macro shot of texture.
  Scene 2: Interaction or lifestyle movement.
  Scene 3: Atmospheric lighting or dynamic angle.
  Return as a JSON array of 3 strings.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });

  return JSON.parse(response.text || '[]');
};
