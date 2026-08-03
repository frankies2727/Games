import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Zap, Sun, Moon, TrendingUp, BookOpen, Info, Sparkles, AlertCircle, DollarSign, Calendar, Activity, Share2, Download, Loader2, ArrowLeft } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';

// Construct the client lazily. Building it eagerly at module load throws when no
// key is configured (e.g. a static deploy without a secret), which would blank
// the whole app; deferring it lets the landing screen render and only the
// generator surface the "needs a key" error.
let _ai: GoogleGenAI | null = null;
const getAi = () => {
  if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const generateImage = async (prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "16:9", fallbackKeyword: string = "abstract") => {
  try {
    const response = await getAi().models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
      }
    }
  } catch (err) {
    console.error("Image generation failed for prompt:", prompt, err);
    const width = aspectRatio === "16:9" ? 1920 : 1080;
    const height = aspectRatio === "16:9" ? 1080 : 1440;
    const url = `https://picsum.photos/seed/${encodeURIComponent(fallbackKeyword)}/${width}/${height}?blur=2`;
    
    // Fetch and convert fallback image to base64 to avoid CORS issues in html-to-image
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (fetchErr) {
      console.error("Failed to fetch fallback image", fetchErr);
      return null;
    }
  }
  return null;
};

const companySchema = {
  type: Type.OBJECT,
  properties: {
    companyName: { type: Type.STRING },
    domainName: { type: Type.STRING },
    tagline: { type: Type.STRING },
    heroImageKeyword: { type: Type.STRING },
    whyItsPopping: { type: Type.STRING },
    whyItsPoppingImageKeyword: { type: Type.STRING },
    financeData: {
      type: Type.OBJECT,
      properties: {
        ticker: { type: Type.STRING },
        marketCap: { type: Type.STRING },
        trendData: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: "Array of 10 integers representing recent stock/valuation trend" },
        wallStreetVibe: { type: Type.STRING, description: "How Wall Street views them (e.g. 'Bullish', 'Meme Stock', 'Blue Chip')" },
        imageKeyword: { type: Type.STRING, description: "Keyword for a finance/money related artistic image" }
      },
      required: ["ticker", "marketCap", "trendData", "wallStreetVibe", "imageKeyword"]
    },
    recentMilestones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.STRING },
          event: { type: Type.STRING }
        },
        required: ["year", "event"]
      }
    },
    timelineImageKeyword: { type: Type.STRING, description: "Keyword for an image representing the company's journey or history" },
    originStory: {
      type: Type.OBJECT,
      properties: {
        yearFounded: { type: Type.INTEGER },
        founders: { type: Type.ARRAY, items: { type: Type.STRING } },
        story: { type: Type.STRING },
        imageKeyword: { type: Type.STRING }
      },
      required: ["yearFounded", "founders", "story", "imageKeyword"]
    },
    notableProducts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          impactScore: { type: Type.INTEGER },
          imageKeyword: { type: Type.STRING }
        },
        required: ["name", "description", "impactScore", "imageKeyword"]
      }
    },
    culturalImpact: { type: Type.STRING },
    cultureImageKeyword: { type: Type.STRING },
    funNuggets: { type: Type.ARRAY, items: { type: Type.STRING } },
    funNuggetsImageKeyword: { type: Type.STRING },
    vibeStats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.INTEGER }
        },
        required: ["label", "value"]
      }
    },
    statsImageKeyword: { type: Type.STRING }
  },
  required: ["companyName", "domainName", "tagline", "heroImageKeyword", "whyItsPopping", "whyItsPoppingImageKeyword", "financeData", "recentMilestones", "timelineImageKeyword", "originStory", "notableProducts", "culturalImpact", "cultureImageKeyword", "funNuggets", "funNuggetsImageKeyword", "vibeStats", "statsImageKeyword"]
};

type CompanyData = {
  companyName: string;
  domainName: string;
  tagline: string;
  heroImageKeyword: string;
  whyItsPopping: string;
  whyItsPoppingImageKeyword: string;
  financeData: { ticker: string; marketCap: string; trendData: number[]; wallStreetVibe: string; imageKeyword: string; };
  recentMilestones: { year: string; event: string }[];
  timelineImageKeyword: string;
  originStory: { yearFounded: number; founders: string[]; story: string; imageKeyword: string };
  notableProducts: { name: string; description: string; impactScore: number; imageKeyword: string }[];
  culturalImpact: string;
  cultureImageKeyword: string;
  funNuggets: string[];
  funNuggetsImageKeyword: string;
  vibeStats: { label: string; value: number }[];
  statsImageKeyword: string;
};

const PREPOPULATED_COMPANIES = [
  { name: "Nvidia", sector: "Tech & AI", color: "from-[#76b900] via-[#5a8f00] to-[#005c00]" },
  { name: "A24", sector: "Entertainment", color: "from-gray-700 via-gray-900 to-black" },
  { name: "Patagonia", sector: "Apparel", color: "from-orange-500 via-red-600 to-stone-800" },
  { name: "SpaceX", sector: "Aerospace", color: "from-slate-600 via-slate-800 to-black" },
  { name: "Spotify", sector: "Audio", color: "from-[#1DB954] via-[#1aa34a] to-[#121212]" },
  { name: "Stripe", sector: "Fintech", color: "from-[#635BFF] via-[#4b45c6] to-[#0a2540]" },
  { name: "Duolingo", sector: "EdTech", color: "from-[#58CC02] via-[#46A302] to-[#2b6301]" },
  { name: "LVMH", sector: "Luxury", color: "from-amber-600 via-yellow-700 to-yellow-900" },
  { name: "OpenAI", sector: "AI Research", color: "from-teal-500 via-emerald-600 to-green-900" },
  { name: "Epic Games", sector: "Gaming", color: "from-blue-600 via-indigo-700 to-purple-900" },
  { name: "Red Bull", sector: "Energy", color: "from-blue-500 via-red-500 to-yellow-500" },
  { name: "Liquid Death", sector: "Beverage", color: "from-zinc-800 via-zinc-900 to-black" },
];

export function VibeCheck({ onExit }: { onExit: () => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompanyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string | null>>({});
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const initQuery = new URLSearchParams(window.location.search).get('q');
    if (initQuery) {
      setQuery(initQuery);
      handleSearch(initQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchImages = async (parsedData: CompanyData) => {
    const hero = await generateImage(`A cinematic, highly stylized image representing the vibe of ${parsedData.companyName}. Keyword: ${parsedData.heroImageKeyword}. Dark mode aesthetic, neon accents, abstract, high quality, no text.`, "16:9", parsedData.heroImageKeyword);
    setImages(prev => ({ ...prev, hero }));
    await delay(3500);

    const finance = await generateImage(`A sleek, modern, abstract representation of finance, wealth, and the stock market for ${parsedData.companyName}. Keyword: ${parsedData.financeData.imageKeyword}. High quality, editorial, no text.`, "16:9", parsedData.financeData.imageKeyword);
    setImages(prev => ({ ...prev, finance }));
    await delay(3500);

    const timeline = await generateImage(`An artistic, conceptual image representing the journey, history, and evolution of ${parsedData.companyName}. Keyword: ${parsedData.timelineImageKeyword}. High quality, cinematic, no text.`, "16:9", parsedData.timelineImageKeyword);
    setImages(prev => ({ ...prev, timeline }));
    await delay(3500);

    const whyItsPopping = await generateImage(`A dynamic, energetic illustration representing why ${parsedData.companyName} is trending right now. Keyword: ${parsedData.whyItsPoppingImageKeyword}. High quality, modern, vibrant, no text.`, "16:9", parsedData.whyItsPoppingImageKeyword);
    setImages(prev => ({ ...prev, whyItsPopping }));
    await delay(3500);

    const origin = await generateImage(`An artistic illustration representing the origin story of ${parsedData.companyName}. Keyword: ${parsedData.originStory.imageKeyword}. High quality, editorial style, dark background, no text.`, "16:9", parsedData.originStory.imageKeyword);
    setImages(prev => ({ ...prev, origin }));
    await delay(3500);

    const culture = await generateImage(`A conceptual, stylized image representing the cultural impact of ${parsedData.companyName}. Keyword: ${parsedData.cultureImageKeyword}. High quality, atmospheric, dark mode aesthetic, neon lighting, no text.`, "16:9", parsedData.cultureImageKeyword);
    setImages(prev => ({ ...prev, culture }));
    await delay(3500);

    const funNuggets = await generateImage(`A fun, quirky, pop-art style background image representing interesting facts about ${parsedData.companyName}. Keyword: ${parsedData.funNuggetsImageKeyword}. High quality, vibrant colors, no text.`, "16:9", parsedData.funNuggetsImageKeyword);
    setImages(prev => ({ ...prev, funNuggets }));
    await delay(3500);

    const stats = await generateImage(`A high-tech, futuristic, data-driven abstract image for ${parsedData.companyName}. Keyword: ${parsedData.statsImageKeyword}. High quality, glowing lines, no text.`, "16:9", parsedData.statsImageKeyword);
    setImages(prev => ({ ...prev, stats }));
    await delay(3500);

    for (let i = 0; i < parsedData.notableProducts.length; i++) {
      const product = parsedData.notableProducts[i];
      const prodImg = await generateImage(`A sleek, modern, stylized product shot or conceptual representation of ${product.name} by ${parsedData.companyName}. Keyword: ${product.imageKeyword}. High quality, dark background with neon accents, no text.`, "16:9", product.imageKeyword);
      setImages(prev => ({ ...prev, [`product_${i}`]: prodImg }));
      if (i < parsedData.notableProducts.length - 1) await delay(3500);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);

    if (!process.env.GEMINI_API_KEY) {
      setError("VibeCheck's generator needs a Gemini API key. Set GEMINI_API_KEY to bring it to life.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setImages({});

    try {
      const response = await getAi().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Give me a hipster, fun, and visually rich breakdown of the company: "${searchQuery}". Make it accurate but playful and modern. Include financial vibes, a timeline, and explicitly search for and include the most recent news, controversies, or reasons why this company is hot and popping *today* in the "whyItsPopping" field.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: companySchema,
          temperature: 0.7,
          tools: [{ googleSearch: {} }]
        }
      });

      if (response.text) {
        const parsedData = JSON.parse(response.text) as CompanyData;
        
        // Update URL to match search query
        const url = new URL(window.location.href);
        url.searchParams.set('q', searchQuery);
        window.history.pushState({}, '', url.toString());

        setData(parsedData);
        fetchImages(parsedData);
      } else {
        setError("Couldn't catch the vibe. Try another company.");
      }
    } catch (err) {
      console.error(err);
      setError("Whoops, the mainframe glitched. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleShare = async () => {
    if (!data) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(data.companyName)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.companyName} - VibeCheck`,
          text: `Check out this visual breakdown of ${data.companyName}!`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('User cancelled share or share failed', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const handleDownloadToggle = () => {
    setIsDownloadModalOpen(true);
  };

  const handleDownload = async (mode: 'current' | 'all') => {
    if (!data) return;
    setIsDownloading(true);
    setIsDownloadModalOpen(false);
    
    try {
      if (mode === 'current') {
        const node = document.getElementById(`slide-${currentSlideIndex}`);
        if (!node) throw new Error('Slide not found');

        // slight delay
        await delay(300);

        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          quality: 0.95,
        });

        saveAs(dataUrl, `${data.companyName.replace(/\s+/g, '_')}_Slide_${currentSlideIndex + 1}.png`);
      } else if (mode === 'all') {
        const totalSlides = slides.length;
        for (let i = 0; i < totalSlides; i++) {
          const node = document.getElementById(`slide-${i}`);
          if (!node) continue;

          // Optional: scroll into view to ensure rendering if lazy loaded
          node.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
          await delay(300); // Wait for scroll and render

          const dataUrl = await toPng(node, {
            cacheBust: true,
            pixelRatio: 2,
            quality: 0.95,
          });

          saveAs(dataUrl, `${data.companyName.replace(/\s+/g, '_')}_Slide_${i + 1}.png`);
          await delay(500); // Throttling
        }
      }
    } catch (err) {
      console.error("Download failed", err);
      alert("Something went wrong during the download. It might be due to a browser security restriction (CORS) with external images.");
    } finally {
      setIsDownloading(false);
    }
  };

  const slides: any[] = [];
  if (data) {
    slides.push({ id: 'hero', type: 'hero', image: images.hero });
    slides.push({ id: 'finance', type: 'finance', title: "Wall Street Vibe", icon: <DollarSign className="w-8 h-8 text-[#00ffcc]" />, data: data.financeData, image: images.finance });
    slides.push({ id: 'timeline', type: 'timeline', title: "The Journey", icon: <Calendar className="w-8 h-8 text-[#ffaa00]" />, milestones: data.recentMilestones, image: images.timeline });
    slides.push({ id: 'why', type: 'text', title: "Why It's Popping", icon: <TrendingUp className="w-8 h-8 text-[#ff00ff]" />, content: data.whyItsPopping, image: images.whyItsPopping });
    slides.push({ id: 'origin', type: 'text', title: "The Origin Lore", icon: <BookOpen className="w-8 h-8 text-[#ccff00]" />, content: data.originStory.story, image: images.origin });
    slides.push({ id: 'culture', type: 'text', title: "Cultural Impact", icon: <Info className="w-8 h-8 text-[#00ffcc]" />, content: data.culturalImpact, image: images.culture });
    slides.push({ id: 'fun', type: 'list', title: "Fun Nuggets", icon: <Sparkles className="w-8 h-8 text-[#ccff00]" />, items: data.funNuggets, image: images.funNuggets });
    
    data.notableProducts.forEach((p, i) => {
      slides.push({ id: `product_${i}`, type: 'product', product: p, image: images[`product_${i}`] });
    });

    slides.push({ id: 'stats', type: 'stats', title: "Vibe Check", icon: <Activity className="w-8 h-8 text-[#00ffff]" />, stats: data.vibeStats, image: images.stats });
  }

  const renderSlideContent = (slide: any, index: number) => {
    if (slide.type === 'hero') {
      return (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            {slide.image === undefined ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-[#111]">
                <div className="w-12 h-12 border-4 border-gray-300 dark:border-white/10 border-t-[#ccff00] rounded-full animate-spin"></div>
                <p className="text-sm font-mono text-gray-500 uppercase tracking-widest animate-pulse">Generating Image...</p>
              </div>
            ) : slide.image === null ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-50 bg-gray-100 dark:bg-[#111]">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-white/5 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Image Unavailable</p>
              </div>
            ) : (
              <>
                <motion.img 
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1.05, opacity: 1 }}
                  transition={{ 
                    opacity: { duration: 0.8 },
                    scale: { duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }
                  }}
                  src={slide.image} 
                  alt="Hero Background" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/20" />
              </>
            )}
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center text-center overflow-y-auto max-h-[85vh] custom-scrollbar">
            {data?.domainName && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 sm:mb-8 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 p-3 sm:p-4 shadow-2xl flex items-center justify-center shrink-0"
              >
                <img 
                  src={`https://logo.clearbit.com/${data.domainName}`} 
                  alt={`${data?.companyName} logo`}
                  className="w-full h-full object-contain drop-shadow-md"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            )}
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase mb-4 sm:mb-6 text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] max-w-full break-words leading-tight">
              {data?.companyName}
            </h2>
            <p className="text-lg sm:text-xl md:text-3xl text-[#ccff00] font-mono italic drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] max-w-4xl break-words bg-black/60 backdrop-blur-md border border-white/10 px-4 sm:px-6 py-3 rounded-2xl inline-block">
              "{data?.tagline}"
            </p>
          </div>
        </div>
      );
    }

    // Full Screen Background Layout for all other slides
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center md:justify-start md:pl-24 p-6 bg-black">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {slide.image === undefined ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-[#111]">
              <div className="w-12 h-12 border-4 border-gray-300 dark:border-white/10 border-t-[#ccff00] rounded-full animate-spin"></div>
              <p className="text-sm font-mono text-gray-500 uppercase tracking-widest animate-pulse">Generating Image...</p>
            </div>
          ) : slide.image === null ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 opacity-50 bg-gray-100 dark:bg-[#111]">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-white/5 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-mono text-gray-500 uppercase tracking-widest">Image Unavailable</p>
            </div>
          ) : (
            <>
              <motion.img 
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1.05, opacity: 1 }}
                transition={{ 
                  opacity: { duration: 0.8 },
                  scale: { duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }
                }}
                src={slide.image} 
                alt={slide.title} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/10" />
            </>
          )}
        </div>

        {/* Content Card Overlay */}
        <div className="relative z-10 w-full max-w-2xl bg-black/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[80vh] custom-scrollbar">
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            {slide.icon}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wider text-white leading-tight drop-shadow-md">
              {slide.title || slide.product?.name}
            </h2>
          </div>

          {slide.type === 'text' && (
            <p className="text-lg md:text-xl lg:text-2xl text-gray-200 leading-relaxed font-medium drop-shadow-sm">
              {slide.content}
            </p>
          )}

          {slide.type === 'list' && (
            <ul className="space-y-4 md:space-y-6">
              {slide.items.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 md:gap-4">
                  <span className="text-2xl md:text-3xl leading-none mt-1 text-[#ccff00] shrink-0 drop-shadow-md">✨</span>
                  <span className="text-lg md:text-xl font-medium text-gray-200 leading-snug drop-shadow-sm">{item}</span>
                </li>
              ))}
            </ul>
          )}

          {slide.type === 'product' && (
            <div>
              <p className="text-lg md:text-xl lg:text-2xl text-gray-200 leading-relaxed font-medium mb-8 md:mb-12 drop-shadow-sm">
                {slide.product.description}
              </p>
              <div className="flex items-center gap-4 md:gap-6 bg-black/40 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10">
                <div className="text-lg md:text-xl font-mono text-[#ff3366] shrink-0 uppercase tracking-widest font-bold">Impact: {slide.product.impactScore}</div>
                <div className="flex-1 h-3 md:h-4 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#ff3366] rounded-full shadow-[0_0_10px_#ff3366]"
                    style={{ width: `${slide.product.impactScore}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {slide.type === 'finance' && (
            <div className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="bg-black/40 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10">
                  <div className="text-xs md:text-sm text-gray-400 uppercase tracking-widest mb-1 md:mb-2">Ticker</div>
                  <div className="text-2xl md:text-4xl font-black text-white truncate">{slide.data.ticker}</div>
                </div>
                <div className="bg-black/40 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10">
                  <div className="text-xs md:text-sm text-gray-400 uppercase tracking-widest mb-1 md:mb-2">Market Cap</div>
                  <div className="text-2xl md:text-4xl font-black text-[#00ffcc] truncate drop-shadow-md">{slide.data.marketCap}</div>
                </div>
              </div>
              <div className="bg-black/40 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10">
                <div className="text-xs md:text-sm text-gray-400 uppercase tracking-widest mb-1 md:mb-2">Wall Street Vibe</div>
                <div className="text-lg md:text-2xl font-medium text-gray-200 italic leading-snug">"{slide.data.wallStreetVibe}"</div>
              </div>
              <div className="h-48 md:h-64 w-full mt-6 md:mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={slide.data.trendData.map((val: number, i: number) => ({ name: i, value: val }))}>
                    <defs>
                      <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px' }}
                      itemStyle={{ color: '#00ffcc', fontWeight: 'bold' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#00ffcc" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {slide.type === 'timeline' && (
            <div className="space-y-6 md:space-y-8 mt-4 border-l-4 border-white/20 pl-6 md:pl-8 ml-3 md:ml-4 relative">
              {slide.milestones.map((m: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="absolute -left-[35px] md:-left-[42px] top-1.5 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#ffaa00] shadow-[0_0_15px_rgba(255,170,0,0.8)] border-4 border-[#0a0a0a]" />
                  <h4 className="text-xl md:text-2xl font-black text-[#ffaa00] mb-1 md:mb-2 font-mono drop-shadow-md">{m.year}</h4>
                  <p className="text-gray-200 text-lg md:text-xl leading-relaxed drop-shadow-sm">{m.event}</p>
                </motion.div>
              ))}
            </div>
          )}

          {slide.type === 'stats' && (
            <div className="w-full h-[300px] md:h-[400px] lg:h-[500px] mt-6 md:mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={slide.stats}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="label" tick={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Vibe" dataKey="value" stroke="#00ffff" strokeWidth={3} fill="#00ffff" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-[100dvh] bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-[#e5e5e5] font-sans selection:bg-[#ccff00] selection:text-black transition-colors duration-300 flex flex-col overflow-hidden">
        {/* Header / Search */}
        <header className="absolute top-0 left-0 right-0 z-50 bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 p-4 transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={onExit}
                className="p-2 rounded-full bg-white/50 dark:bg-black/50 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:text-[#ccff00] hover:border-[#ccff00] transition-colors backdrop-blur-md shadow-sm shrink-0 mr-1"
                title="Back to projects"
                type="button"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Zap className="w-8 h-8 text-[#ccff00]" />
              <h1 className="text-2xl font-bold tracking-tighter uppercase text-gray-900 dark:text-white drop-shadow-md hidden sm:block">VibeCheck</h1>
              {data?.domainName && (
                <>
                  <span className="text-gray-300 dark:text-gray-700 mx-2 hidden sm:block">/</span>
                  <div className="flex items-center gap-3 bg-white/50 dark:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/10 shadow-sm">
                    <img 
                      src={`https://logo.clearbit.com/${data.domainName}`} 
                      alt={`${data.companyName} logo`} 
                      className="h-6 w-6 object-contain rounded-full bg-white" 
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-bold text-gray-900 dark:text-white tracking-tight">{data.companyName}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              {data && (
                <form onSubmit={onSubmit} className="w-full md:w-auto relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-500 dark:text-gray-400 group-focus-within:text-[#ccff00] transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search another company..."
                    className="w-full md:w-64 bg-white/50 dark:bg-black/50 border border-gray-300 dark:border-white/20 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00] transition-all placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white backdrop-blur-md shadow-sm text-sm"
                  />
                </form>
              )}
              {data && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-white/50 dark:bg-black/50 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:text-[#ccff00] hover:border-[#ccff00] transition-colors backdrop-blur-md shadow-sm shrink-0"
                    title="Share Link"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDownloadToggle}
                    disabled={isDownloading}
                    className="p-2 rounded-full bg-white/50 dark:bg-black/50 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:text-[#ccff00] hover:border-[#ccff00] transition-colors backdrop-blur-md shadow-sm shrink-0 disabled:opacity-50 disabled:hover:text-white disabled:hover:border-white/20"
                    title="Download Screenshots"
                  >
                    {isDownloading ? <Loader2 className="w-5 h-5 animate-spin text-[#ccff00]" /> : <Download className="w-5 h-5" />}
                  </button>
                </div>
              )}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-white/50 dark:bg-black/50 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:text-[#ccff00] transition-colors backdrop-blur-md shadow-sm shrink-0"
                type="button"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        <main id="capture-area" className="flex-1 relative w-full h-[100dvh] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] z-40"
              >
                <div className="w-16 h-16 border-4 border-gray-200 dark:border-white/10 border-t-[#ccff00] rounded-full animate-spin mb-6"></div>
                <p className="text-gray-500 dark:text-gray-400 font-mono text-sm uppercase tracking-widest animate-pulse">Generating Visuals & Data...</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute z-40 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4 text-red-600 dark:text-red-400 max-w-lg mx-auto"
              >
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}

            {!data && !loading && !error && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="absolute inset-0 overflow-y-auto pt-24 md:pt-32 pb-12 flex flex-col items-center justify-start z-10 px-4"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-[0_0_60px_rgba(204,255,0,0.15)] shrink-0">
                  <Zap className="w-12 h-12 md:w-16 md:h-16 text-[#ccff00]" />
                </div>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase mb-4 md:mb-6 text-gray-900 dark:text-white text-center">
                  Check the Vibe
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto text-center mb-8">
                  Type any company name below or select a trending brand to generate an immersive, highly visual story.
                </p>

                <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto relative group mb-16">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Search className="h-6 w-6 text-gray-400 group-focus-within:text-[#ccff00] transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter a company name (e.g., Netflix, Nike, OpenAI)..."
                    className="w-full bg-white dark:bg-[#141414] border-2 border-gray-200 dark:border-white/10 rounded-full py-4 pl-16 pr-32 focus:outline-none focus:border-[#ccff00] transition-all placeholder-gray-400 text-gray-900 dark:text-white shadow-xl text-lg md:text-xl"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ccff00] text-black px-6 py-2.5 rounded-full font-bold hover:bg-[#b3e600] transition-colors shadow-md">
                    Search
                  </button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl mx-auto">
                  {PREPOPULATED_COMPANIES.map((company) => (
                    <motion.button
                      key={company.name}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSearch(company.name)}
                      className={`relative overflow-hidden rounded-3xl p-6 text-left shadow-lg transition-all hover:shadow-2xl group bg-gradient-to-br ${company.color} animate-gradient min-h-[140px] md:min-h-[160px] flex flex-col justify-end border border-white/10`}
                    >
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
                      <div className="relative z-10 transform group-hover:-translate-y-1 transition-transform duration-300">
                        <h3 className="text-xl md:text-2xl font-black text-white mb-1 tracking-tight drop-shadow-md">{company.name}</h3>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest drop-shadow-md">{company.sector}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {data && !loading && (
              <>
                {/* Progress Indicator */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                  {slides.map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlideIndex ? 'bg-[#ccff00] scale-150' : 'bg-gray-400/50 dark:bg-gray-600/50'}`}
                    />
                  ))}
                </div>

                {isDownloadModalOpen && (
                  <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-2xl p-6 shadow-2xl max-w-sm w-full"
                    >
                      <h3 className="text-xl font-bold mb-4 font-sans tracking-tight text-gray-900 dark:text-white">Download Screenshots</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        How would you like to save this VibeCheck?
                      </p>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => handleDownload('current')}
                          className="w-full py-3 px-4 bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
                        >
                          Download Slide {currentSlideIndex + 1}
                        </button>
                        <button 
                          onClick={() => handleDownload('all')}
                          className="w-full py-3 px-4 bg-[#ccff00] text-black hover:bg-[#b3e600] rounded-xl font-bold transition-colors shadow-lg shadow-[#ccff00]/20"
                        >
                          Download All ({slides.length} images)
                        </button>
                        <button 
                          onClick={() => setIsDownloadModalOpen(false)}
                          className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}

                <motion.div
                  key="slides-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 w-full h-full overflow-y-auto snap-y snap-mandatory custom-scrollbar scroll-smooth"
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    const index = Math.round(target.scrollTop / target.clientHeight);
                    setCurrentSlideIndex(index);
                  }}
                >
                  {slides.map((slide, index) => (
                    <div id={`slide-${index}`} key={slide.id} className="w-full h-[100dvh] snap-start relative bg-gray-50 dark:bg-[#0a0a0a]">
                      {renderSlideContent(slide, index)}
                      
                      {/* Page Number */}
                      <div className="absolute bottom-6 right-6 text-xs font-bold font-mono text-gray-500/50 dark:text-gray-400/50 z-40 select-none">
                        {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Persistent Footer */}
          <div className="fixed bottom-6 pb-[env(safe-area-inset-bottom)] left-1/2 -translate-x-1/2 z-50 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-gray-200/50 dark:border-white/10 shadow-sm whitespace-nowrap">
            Made by{' '}
            <a href="https://www.linkedin.com/in/francisco27/" target="_blank" rel="noopener noreferrer" className="hover:text-[#ccff00] dark:hover:text-[#ccff00] transition-colors font-bold">Frankie</a>
            <span className="mx-2 opacity-50">//</span>
            Powered by{' '}
            <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer" className="hover:text-[#ccff00] dark:hover:text-[#ccff00] transition-colors font-bold">Gemini</a>
          </div>
        </main>
      </div>
    </div>
  );
}
