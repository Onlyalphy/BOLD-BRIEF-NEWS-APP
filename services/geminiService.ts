import { GoogleGenAI } from "@google/genai";
import { Category, Region, NewsArticle, Source } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Detailed configuration based on region and category
const REGION_CONFIG: Record<Region, Partial<Record<Category, { query: string; weight: number }>>> = {
  [Region.KENYA]: {
    [Category.GEOPOLITICS]: { query: "Kenya politics OR #KenyaPolitics OR Ruto OR Raila lang:en place_country:KE", weight: 1.3 },
    [Category.BUSINESS]: { query: "Kenya business OR Nairobi Stock Exchange OR #KenyaEconomy lang:en place_country:KE", weight: 1.2 },
    [Category.AI]: { query: "Kenya AI OR #KenyaTech OR Nairobi innovation lang:en place_country:KE", weight: 1.1 },
    [Category.CRYPTO]: { query: "Kenya crypto OR Nairobi stocks OR #KenyaCrypto lang:en place_country:KE", weight: 1.0 },
    [Category.HEALTH]: { query: "Kenya health OR #KenyaHealth OR Ministry of Health lang:en place_country:KE", weight: 1.2 },
    [Category.CLIMATE]: { query: "Kenya climate OR drought OR floods OR #ClimateKenya lang:en place_country:KE", weight: 1.3 },
    [Category.ENTERTAINMENT]: { query: "Kenya entertainment OR #KenyaMusic OR #KenyaFilm OR celebrity lang:en place_country:KE", weight: 0.8 },
    [Category.WAR]: { query: "Kenya border security OR KDF OR Al-Shabaab lang:en place_country:KE", weight: 1.3 }
  },
  [Region.EAST_AFRICA]: {
    [Category.GEOPOLITICS]: { query: "East Africa politics OR EAC OR Uganda OR Tanzania OR Rwanda lang:en", weight: 1.3 },
    [Category.BUSINESS]: { query: "East Africa economy OR #EACBusiness OR regional trade lang:en", weight: 1.2 },
    [Category.AI]: { query: "East Africa AI OR #TechAfrica OR innovation lang:en", weight: 1.1 },
    [Category.CRYPTO]: { query: "East Africa crypto OR #CryptoAfrica OR stock market lang:en", weight: 1.0 },
    [Category.HEALTH]: { query: "East Africa health OR #HealthAfrica OR WHO Africa lang:en", weight: 1.2 },
    [Category.CLIMATE]: { query: "East Africa climate OR drought OR floods OR #ClimateAfrica lang:en", weight: 1.3 },
    [Category.ENTERTAINMENT]: { query: "East Africa entertainment OR #MusicAfrica OR #FilmAfrica lang:en", weight: 0.8 },
    [Category.WAR]: { query: "East Africa conflict OR DRC conflict OR Somalia lang:en", weight: 1.3 }
  },
  [Region.AFRICA]: {
    [Category.GEOPOLITICS]: { query: "Africa politics OR AU OR African Union OR #AfricaPolitics lang:en", weight: 1.3 },
    [Category.BUSINESS]: { query: "Africa business OR #AfricaEconomy OR AfCFTA lang:en", weight: 1.2 },
    [Category.AI]: { query: "Africa AI OR #AfricaTech OR innovation lang:en", weight: 1.1 },
    [Category.CRYPTO]: { query: "Africa crypto OR #CryptoAfrica OR Johannesburg Stock Exchange lang:en", weight: 1.0 },
    [Category.HEALTH]: { query: "Africa health OR #HealthAfrica OR WHO Africa lang:en", weight: 1.2 },
    [Category.CLIMATE]: { query: "Africa climate OR #ClimateAfrica OR COP lang:en", weight: 1.3 },
    [Category.ENTERTAINMENT]: { query: "Africa entertainment OR #Afrobeats OR #AfricanFilm lang:en", weight: 0.8 },
    [Category.WAR]: { query: "Africa conflict OR Sudan war OR Sahel security lang:en", weight: 1.3 }
  },
  [Region.GLOBAL]: {
    [Category.GEOPOLITICS]: { query: "global politics OR geopolitics OR #WorldPolitics lang:en", weight: 1.4 },
    [Category.BUSINESS]: { query: "global economy OR #BusinessNews OR IMF OR World Bank lang:en", weight: 1.3 },
    [Category.AI]: { query: "AI OR #ArtificialIntelligence OR #TechNews lang:en", weight: 1.2 },
    [Category.CRYPTO]: { query: "crypto OR Bitcoin OR Ethereum OR #StockMarket lang:en", weight: 1.1 },
    [Category.HEALTH]: { query: "global health OR WHO OR #HealthNews lang:en", weight: 1.3 },
    [Category.CLIMATE]: { query: "climate change OR #ClimateCrisis OR COP lang:en", weight: 1.4 },
    [Category.ENTERTAINMENT]: { query: "global entertainment OR #Hollywood OR #MusicNews OR celebrity lang:en", weight: 0.9 },
    [Category.WAR]: { query: "Ukraine war OR Gaza conflict OR global security lang:en", weight: 1.4 }
  }
};

const getQueryConfig = (region: Region, category: Category) => {
  const regionConfig = REGION_CONFIG[region];
  if (!regionConfig) return { query: `${region} ${category} news`, weight: 1.0 };
  
  const config = regionConfig[category];
  // Fallback if the specific category isn't mapped
  if (!config) return { query: `${region} ${category} news`, weight: 1.0 };
  
  return config;
};

/**
 * Step 1: Ingestor & Ranker
 */
export const fetchTrendingTopic = async (
  category: Category,
  region: Region
): Promise<{ topic: string; context: string; sources: Source[] } | null> => {
  const ai = getClient();
  const { query, weight } = getQueryConfig(region, category);

  const prompt = `
    Act as the Ingestion Engine for Bold Briefing.
    Execute Search: "${query}".
    
    RANKING ALGORITHM:
    1. Scan for recent topics (last 24h).
    2. Sort by Global Attention (mentions, major outlets).
    3. Filter out low-quality rumors.
    4. Select the #1 highest velocity topic.
    
    Config Weight: ${weight} (Prioritize high weight topics if scanning multiple).

    If nothing significant/verified is found, return "NO_TREND".
    Otherwise, return a summary of the topic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    if (text.includes("NO_TREND")) {
      return null;
    }

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Source[] = chunks
      .map((chunk: any) => ({
        title: chunk.web?.title || "Source",
        url: chunk.web?.uri || "",
      }))
      .filter((s: Source) => s.url !== "");

    return {
      topic: text,
      context: text,
      sources: sources.slice(0, 5),
    };
  } catch (error) {
    console.error("Error fetching trend:", error);
    throw error;
  }
};

/**
 * Step 2: Verifier & Brief Writer
 */
export const draftBriefing = async (
  topic: string,
  context: string,
  category: Category,
  region: Region,
  existingSources: Source[]
): Promise<NewsArticle> => {
  const ai = getClient();

  const prompt = `
    Topic: ${topic}
    Region: ${region}
    
    VERIFICATION PROTOCOL:
    1. Cross-reference with sources: ${existingSources.map(s => s.title).join(', ')}.
    2. Require 2+ independent sources. If <2, set status to 'developing'.
    
    BRIEF GENERATION:
    - Tone: Neutral, Factual, Concise (120-220 words).
    - Headline: <100 chars, punchy.
    - Key Points: 3-5 bullets.
    - Context: Why it matters for ${region}.
    
    Output JSON:
    {
      "headline": "...",
      "summary": "...",
      "tweetDraft": "Headline + #Tags + [Link]",
      "hashtags": ["#tag1", "#tag2"],
      "verificationScore": 95, 
      "status": "published" | "developing",
      "rankingScore": 88
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const jsonStr = response.text || "{}";
  const data = JSON.parse(jsonStr);

  return {
    id: crypto.randomUUID(),
    headline: data.headline || "Update",
    summary: data.summary || topic,
    category,
    region,
    timestamp: Date.now(),
    sources: existingSources.slice(0, 3),
    hashtags: data.hashtags || [],
    verificationScore: data.verificationScore || 50,
    tweetDraft: data.tweetDraft || "",
    status: data.status || 'developing',
    rankingScore: data.rankingScore || 70
  };
};

/**
 * Step 3: Image Generator
 */
export const generateBriefImage = async (article: NewsArticle): Promise<string | undefined> => {
  const ai = getClient();

  // Tailored prompts per category
  let visualStyle = "modern, journalistic, clean, editorial illustration";
  if (article.category === Category.GEOPOLITICS) visualStyle += ", symbolic, flags, parliament silhouette, neutral map";
  if (article.category === Category.ENTERTAINMENT) visualStyle += ", concert lighting, red carpet, cinematic, celebrity silhouette";
  if (article.category === Category.CLIMATE) visualStyle += ", earth from space, weather patterns, nature photography style";
  if (article.category === Category.CRYPTO) visualStyle += ", digital finance abstract, blockchain nodes, market graph";
  if (article.category === Category.WAR) visualStyle += ", map based, neutral topographic, strategic overview, no violence";

  const prompt = `
    Generate a news header image.
    Headline: "${article.headline}"
    Context: ${article.summary.substring(0, 100)}
    Style: ${visualStyle}.
    Aspect Ratio: 16:9.
    Constraint: No text overlay. Photorealistic or high-end vector art.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: { aspectRatio: "16:9" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    return undefined;
  }
  return undefined;
};
