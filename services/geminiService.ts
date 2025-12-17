import { GoogleGenAI } from "@google/genai";
import { Category, Region, NewsArticle, Source } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Detailed configuration based on region and category
const REGION_CONFIG: Record<Region, Partial<Record<Category, { query: string; weight: number; image_prompt?: string }>>> = {
  [Region.KENYA]: {
    [Category.GEOPOLITICS]: { 
      query: "Kenya politics OR #KenyaPolitics OR Ruto OR Raila lang:en place_country:KE", 
      weight: 1.3,
      image_prompt: "Kenyan parliament building with flag, symbolic political atmosphere, neutral journalistic style"
    },
    [Category.BUSINESS]: { 
      query: "Kenya business OR Nairobi Stock Exchange OR #KenyaEconomy lang:en place_country:KE", 
      weight: 1.2,
      image_prompt: "Nairobi skyline with stock market charts overlay, modern business theme"
    },
    [Category.AI]: { 
      query: "Kenya AI OR #KenyaTech OR Nairobi innovation lang:en place_country:KE", 
      weight: 1.1,
      image_prompt: "Futuristic Nairobi tech hub with AI icons and digital streams"
    },
    [Category.CRYPTO]: { 
      query: "Kenya crypto OR Nairobi stocks OR #KenyaCrypto lang:en place_country:KE", 
      weight: 1.0,
      image_prompt: "Digital coins and stock tickers blended with Nairobi cityscape"
    },
    [Category.HEALTH]: { 
      query: "Kenya health OR #KenyaHealth OR Ministry of Health lang:en place_country:KE", 
      weight: 1.2,
      image_prompt: "Kenyan hospital exterior with medical icons, clean and factual"
    },
    [Category.SEX_HEALTH]: { 
      query: "Kenya reproductive health OR #LindaMama OR contraceptives Kenya OR maternal health KE OR #SRHRKenya lang:en place_country:KE", 
      weight: 1.1,
      image_prompt: "Medical illustration of reproductive health awareness, neutral and educational, teal and white color palette"
    },
    [Category.CLIMATE]: { 
      query: "Kenya climate OR drought OR floods OR #ClimateKenya lang:en place_country:KE", 
      weight: 1.3,
      image_prompt: "Dry cracked earth and floodwaters in Kenya, climate impact visual"
    },
    [Category.ENTERTAINMENT]: { 
      query: "Kenya entertainment OR #KenyaMusic OR #KenyaFilm OR celebrity lang:en place_country:KE", 
      weight: 0.8,
      image_prompt: "Concert crowd in Nairobi with bright lights and music notes"
    },
    [Category.GOSSIP]: { 
      query: "Kenya celebrity gossip OR #KenyaTea OR #NairobiGossip OR viral scandal Kenya lang:en place_country:KE", 
      weight: 0.7,
      image_prompt: "Tabloid style collage, blurred silhouettes, paparazzi flash aesthetic, neon pink accents"
    },
    [Category.WAR]: { 
      query: "Kenya border security OR KDF OR Al-Shabaab lang:en place_country:KE", 
      weight: 1.3,
      image_prompt: "Neutral tactical map of Kenya border region, strategic overview"
    }
  },
  [Region.EAST_AFRICA]: {
    [Category.GEOPOLITICS]: { query: "East Africa politics OR EAC OR Uganda OR Tanzania OR Rwanda lang:en", weight: 1.3 },
    [Category.BUSINESS]: { query: "East Africa economy OR #EACBusiness OR regional trade lang:en", weight: 1.2 },
    [Category.AI]: { query: "East Africa AI OR #TechAfrica OR innovation lang:en", weight: 1.1 },
    [Category.CRYPTO]: { query: "East Africa crypto OR #CryptoAfrica OR stock market lang:en", weight: 1.0 },
    [Category.HEALTH]: { query: "East Africa health OR #HealthAfrica OR WHO Africa lang:en", weight: 1.2 },
    [Category.SEX_HEALTH]: { query: "East Africa reproductive health OR maternal health Uganda Tanzania OR #SexualHealthAfrica lang:en", weight: 1.1, image_prompt: "African community health worker illustration, educational and warm tones" },
    [Category.CLIMATE]: { query: "East Africa climate OR drought OR floods OR #ClimateAfrica lang:en", weight: 1.3 },
    [Category.ENTERTAINMENT]: { query: "East Africa entertainment OR #MusicAfrica OR #FilmAfrica lang:en", weight: 0.8 },
    [Category.GOSSIP]: { query: "East Africa celebrity news OR Diamond Platnumz OR Zari Hassan OR #EastAfricaGossip lang:en", weight: 0.7, image_prompt: "Vibrant abstract collage of microphones and camera lenses" },
    [Category.WAR]: { query: "East Africa conflict OR DRC conflict OR Somalia lang:en", weight: 1.3 }
  },
  [Region.AFRICA]: {
    [Category.GEOPOLITICS]: { query: "Africa politics OR AU OR African Union OR #AfricaPolitics lang:en", weight: 1.3 },
    [Category.BUSINESS]: { query: "Africa business OR #AfricaEconomy OR AfCFTA lang:en", weight: 1.2 },
    [Category.AI]: { query: "Africa AI OR #AfricaTech OR innovation lang:en", weight: 1.1 },
    [Category.CRYPTO]: { query: "Africa crypto OR #CryptoAfrica OR Johannesburg Stock Exchange lang:en", weight: 1.0 },
    [Category.HEALTH]: { query: "Africa health OR #HealthAfrica OR WHO Africa lang:en", weight: 1.2 },
    [Category.SEX_HEALTH]: { query: "Africa reproductive health OR WHO Africa health OR #SRHAfrica lang:en", weight: 1.1, image_prompt: "Map of Africa with health care symbols, clean medical aesthetic" },
    [Category.CLIMATE]: { query: "Africa climate OR #ClimateAfrica OR COP lang:en", weight: 1.3 },
    [Category.ENTERTAINMENT]: { query: "Africa entertainment OR #Afrobeats OR #AfricanFilm lang:en", weight: 0.8 },
    [Category.GOSSIP]: { query: "African celebrity gossip OR Nollywood scandal OR Afrobeats drama OR #AfricaGossip lang:en", weight: 0.7, image_prompt: "Red carpet background with stylized question marks and camera flashes" },
    [Category.WAR]: { query: "Africa conflict OR Sudan war OR Sahel security lang:en", weight: 1.3 }
  },
  [Region.GLOBAL]: {
    [Category.GEOPOLITICS]: { 
      query: "global politics OR geopolitics OR #WorldPolitics lang:en", 
      weight: 1.4,
      image_prompt: "World map with flags and symbolic political leaders silhouettes"
    },
    [Category.BUSINESS]: { 
      query: "global economy OR #BusinessNews OR IMF OR World Bank lang:en", 
      weight: 1.3,
      image_prompt: "Global financial charts with skyscrapers and currency symbols"
    },
    [Category.AI]: { 
      query: "AI OR #ArtificialIntelligence OR #TechNews lang:en", 
      weight: 1.2,
      image_prompt: "Abstract AI brain with glowing circuits and futuristic background"
    },
    [Category.CRYPTO]: { 
      query: "crypto OR Bitcoin OR Ethereum OR #StockMarket lang:en", 
      weight: 1.1,
      image_prompt: "Bitcoin and Ethereum coins with digital trading charts"
    },
    [Category.HEALTH]: { 
      query: "global health OR WHO OR #HealthNews lang:en", 
      weight: 1.3,
      image_prompt: "World health symbol with doctors and medical icons"
    },
    [Category.SEX_HEALTH]: { 
      query: "global reproductive health OR planned parenthood OR WHO sexual health OR #ReproductiveRights lang:en", 
      weight: 1.2,
      image_prompt: "Minimalist illustration of diverse people holding hands, health cross symbol, soft tones"
    },
    [Category.CLIMATE]: { 
      query: "climate change OR #ClimateCrisis OR COP lang:en", 
      weight: 1.4,
      image_prompt: "Earth with extreme weather visuals, storms and drought side by side"
    },
    [Category.ENTERTAINMENT]: { 
      query: "global entertainment OR #Hollywood OR #MusicNews OR celebrity lang:en", 
      weight: 0.9,
      image_prompt: "Red carpet event with cameras flashing, global entertainment vibe"
    },
    [Category.GOSSIP]: { 
      query: "celebrity gossip OR TMZ OR Hollywood scandal OR viral celebrity news lang:en", 
      weight: 0.8,
      image_prompt: "Bold typography 'BREAKING' with abstract celebrity silhouettes and paparazzi lighting"
    },
    [Category.WAR]: { 
      query: "Ukraine war OR Gaza conflict OR global security lang:en", 
      weight: 1.4,
      image_prompt: "Digital global map highlighting conflict zones, neutral tone"
    }
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
  existingSources: Source[],
  enabledCategories: Category[]
): Promise<NewsArticle> => {
  const ai = getClient();

  const prompt = `
    Write a neutral, concise news brief on: ${topic}. 
    Use facts only from these sources: ${existingSources.map(s => s.title).join(', ')}. 
    
    Requirements:
    - Include headline, 3–5 key points, regional context, implications, and 2–4 citations.
    - Length: 120–220 words.
    - Label as Verified or Developing.
    - Time-stamp: ${new Date().toUTCString()}.
    - Generate a matching AI image using the category-specific image prompt.
    - Categories enabled: ${enabledCategories.join(', ')}.
    
    Context: Why it matters for ${region}.
    
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

  // Get specific visual guidance from config if available
  const regionConfig = REGION_CONFIG[article.region];
  const categoryConfig = regionConfig?.[article.category];
  const specificPrompt = categoryConfig?.image_prompt;

  // Fallback visual styles if no specific prompt matches
  let visualStyle = "modern, journalistic, clean, editorial illustration";
  if (!specificPrompt) {
    if (article.category === Category.GEOPOLITICS) visualStyle += ", symbolic, flags, parliament silhouette, neutral map";
    if (article.category === Category.ENTERTAINMENT) visualStyle += ", concert lighting, red carpet, cinematic, celebrity silhouette";
    if (article.category === Category.CLIMATE) visualStyle += ", earth from space, weather patterns, nature photography style";
    if (article.category === Category.CRYPTO) visualStyle += ", digital finance abstract, blockchain nodes, market graph";
    if (article.category === Category.WAR) visualStyle += ", map based, neutral topographic, strategic overview, no violence";
    if (article.category === Category.SEX_HEALTH) visualStyle += ", medical aesthetic, teal and white, educational, diverse community";
    if (article.category === Category.GOSSIP) visualStyle += ", neon lights, blurred paparazzi flash, tabloid collage aesthetic";
  }

  const prompt = `
    Generate a news header image.
    Headline: "${article.headline}"
    Context: ${article.summary.substring(0, 100)}
    ${specificPrompt ? `Specific Visual Theme: ${specificPrompt}` : `Style: ${visualStyle}`}
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
