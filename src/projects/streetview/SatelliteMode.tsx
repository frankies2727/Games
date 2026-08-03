import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Search,
  Satellite,
  MapPin,
  Video,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// NASA GIBS daily true-colour imagery. Public, no API key, and served with
// `Access-Control-Allow-Origin: *`, so tiles can be drawn to a canvas without
// tainting it — which is what makes the client-side video export below work.
//
// Best of both sources: the newer VIIRS sensor has a wider swath (far fewer
// black no-data gaps), but its imagery only goes back to late 2015. So we use
// VIIRS for recent years and fall back to MODIS Terra (available from 2000)
// for older ones. Both share the same EPSG:4326 250m tile grid.
const ZOOM = 6; // ~one tile spanning a wide region, matching the reference.
const TILE = 512;
const VIIRS_FROM_YEAR = 2016;
const layerForYear = (yr: number) =>
  yr >= VIIRS_FROM_YEAR
    ? 'VIIRS_SNPP_CorrectedReflectance_TrueColor'
    : 'MODIS_Terra_CorrectedReflectance_TrueColor';
const sourceLabel = (yr: number) =>
  yr >= VIIRS_FROM_YEAR ? 'VIIRS' : 'MODIS Terra';
const GIBS = (layer: string, date: string, row: number, col: number) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/${layer}/default/${date}/250m/${ZOOM}/${row}/${col}.jpg`;

// EPSG:4326 tile grid math (ported from the reference notebook).
const tileWidthDeg = 288.0 / 2 ** ZOOM;
const getTile = (lat: number, lon: number) => ({
  row: Math.floor((90 - lat) / tileWidthDeg),
  col: Math.floor((lon + 180) / tileWidthDeg),
});
const getPinRatio = (lat: number, lon: number, row: number, col: number) => {
  const tileLonStart = col * tileWidthDeg - 180;
  const tileLatStart = 90 - row * tileWidthDeg;
  return {
    x: (lon - tileLonStart) / tileWidthDeg,
    y: (tileLatStart - lat) / tileWidthDeg,
  };
};

interface Frame {
  date: string;
  url: string;
  img: HTMLImageElement;
}

interface Pin {
  x: number; // 0..1 within the tile
  y: number;
  label: string;
}

const pad = (n: number) => n.toString().padStart(2, '0');
const CADENCES: { label: string; step: number }[] = [
  { label: 'Weekly', step: 7 },
  { label: 'Every 3 days', step: 3 },
  { label: 'Daily', step: 1 },
];
const SPEEDS: { label: string; fps: number }[] = [
  { label: 'Slow', fps: 4 },
  { label: 'Normal', fps: 8 },
  { label: 'Fast', fps: 15 },
];

export function SatelliteMode() {
  const now = new Date();
  const currentYear = now.getUTCFullYear();

  const [place, setPlace] = useState('');
  const [year, setYear] = useState(currentYear - 1);
  const [step, setStep] = useState(7);
  const [fps, setFps] = useState(8);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  const [frames, setFrames] = useState<Frame[]>([]);
  const [pin, setPin] = useState<Pin | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const cancelRef = useRef(false);

  // Playback timer.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => setCurrentIndex((p) => p + 1), 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, frames.length, fps]);

  // Stop at the end.
  useEffect(() => {
    if (isPlaying && frames.length > 0 && currentIndex >= frames.length - 1) {
      setIsPlaying(false);
    }
  }, [currentIndex, isPlaying, frames.length]);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const buildDates = (yr: number, stepDays: number): string[] => {
    const dates: string[] = [];
    const start = Date.UTC(yr, 0, 1);
    let end = Date.UTC(yr, 11, 31);
    if (yr === currentYear) {
      const todayUTC = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      );
      end = Math.min(end, todayUTC - 86400000);
    }
    for (let t = start; t <= end; t += stepDays * 86400000) {
      const d = new Date(t);
      dates.push(
        `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
          d.getUTCDate(),
        )}`,
      );
    }
    return dates;
  };

  // Load a single tile with CORS so the canvas stays untainted; resolves null
  // on missing imagery so gaps just get skipped.
  const loadTile = (url: string, date: string): Promise<Frame | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve({ date, url, img });
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place.trim() || loading) return;

    cancelRef.current = false;
    setLoading(true);
    setError(null);
    setIsPlaying(false);
    setFrames([]);
    setPin(null);
    setCurrentIndex(0);
    setProgress(0);
    setProgressMsg('Locating place…');

    try {
      // 1. Geocode via Open-Meteo (free, no key, CORS-enabled).
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          place.trim(),
        )}&count=1`,
      );
      const geo = await geoRes.json();
      const hit = geo?.results?.[0];
      if (!hit) {
        setError(`Could not find "${place}". Try a city or well-known place.`);
        setLoading(false);
        return;
      }

      const { latitude: lat, longitude: lon } = hit;
      const { row, col } = getTile(lat, lon);
      const ratio = getPinRatio(lat, lon, row, col);
      const label = [hit.name, hit.country_code].filter(Boolean).join(', ');

      // 2. Fetch tiles for the year (VIIRS for recent years, MODIS Terra for
      // older ones).
      const layer = layerForYear(year);
      const dates = buildDates(year, step);
      setProgressMsg(
        `Downloading ${dates.length} ${sourceLabel(year)} frames…`,
      );

      const loaded: Frame[] = [];
      let done = 0;
      const CONCURRENCY = 8;
      for (let i = 0; i < dates.length; i += CONCURRENCY) {
        if (cancelRef.current) return;
        const batch = dates.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map((d) => loadTile(GIBS(layer, d, row, col), d)),
        );
        results.forEach((r) => r && loaded.push(r));
        done += batch.length;
        setProgress((done / dates.length) * 100);
      }

      if (cancelRef.current) return;

      loaded.sort((a, b) => a.date.localeCompare(b.date));
      if (loaded.length === 0) {
        setError(
          'No satellite imagery came back for that place and year. Try a different year.',
        );
        setLoading(false);
        return;
      }

      setPin({ x: ratio.x, y: ratio.y, label });
      setFrames(loaded);
      setCurrentIndex(0);
      setLoading(false);
      setIsPlaying(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong fetching imagery. Please try again.');
      setLoading(false);
    }
  };

  // Fully client-side WebM export. GIBS tiles are CORS-clean, so the canvas is
  // never tainted and MediaRecorder can capture it.
  const exportVideo = async () => {
    if (frames.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportProgress(0);

    const canvas = document.createElement('canvas');
    canvas.width = TILE;
    canvas.height = TILE;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Canvas not supported in this browser.');
      setIsExporting(false);
      return;
    }

    const drawFrame = (frame: Frame) => {
      ctx.drawImage(frame.img, 0, 0, TILE, TILE);

      // City pin + label.
      if (pin) {
        const px = pin.x * TILE;
        const py = pin.y * TILE;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.stroke();

        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.fillStyle = '#fff';
        ctx.strokeText(pin.label, px, py - 14);
        ctx.fillText(pin.label, px, py - 14);
      }

      // Date, bottom-right.
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'right';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.fillStyle = '#fff';
      ctx.strokeText(frame.date, TILE - 14, TILE - 16);
      ctx.fillText(frame.date, TILE - 14, TILE - 16);
    };

    try {
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const finished = new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `satellite-timelapse-${(pin?.label || place)
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase()}-${year}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          resolve();
        };
      });

      recorder.start();
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < frames.length; i++) {
        drawFrame(frames[i]);
        setExportProgress(((i + 1) / frames.length) * 100);
        await sleep(1000 / fps);
      }
      recorder.stop();
      await finished;
    } catch (err) {
      console.error(err);
      setError('Video export failed in this browser.');
    } finally {
      setIsExporting(false);
    }
  };

  const current = frames[currentIndex];

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-100 font-sans">
      {/* Header / controls */}
      <header className="flex-none p-4 md:px-6 md:py-4 border-b border-neutral-800 bg-neutral-900/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Satellite className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl font-medium tracking-tight text-white">
              Satellite
            </h1>
          </div>

          <form
            onSubmit={handleGenerate}
            className="flex-1 max-w-2xl flex flex-wrap gap-2"
          >
            <div className="relative flex-1 min-w-[180px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Place or city (e.g. Dubai)"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all placeholder-neutral-500"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
              />
            </div>
            <input
              type="number"
              min={2000}
              max={currentYear}
              className="w-24 bg-neutral-900 border border-neutral-700 rounded-full py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all tabular-nums"
              value={year}
              onChange={(e) =>
                setYear(
                  Math.max(
                    2000,
                    Math.min(currentYear, parseInt(e.target.value, 10) || currentYear),
                  ),
                )
              }
            />
            <button
              type="submit"
              disabled={loading || !place.trim()}
              className="bg-sky-500 hover:bg-sky-400 text-neutral-950 font-medium py-2 px-6 rounded-full text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[110px]"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-neutral-950/20 border-t-neutral-950 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Cadence selector */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 text-xs">
          <span className="text-neutral-500 font-mono uppercase tracking-widest">
            Sampling
          </span>
          <div className="flex items-center gap-1 bg-neutral-800 rounded-full px-1 py-1">
            {CADENCES.map((c) => (
              <button
                key={c.step}
                type="button"
                onClick={() => setStep(c.step)}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  step === c.step
                    ? 'bg-neutral-700 text-sky-400'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <span className="ml-auto text-neutral-500 hidden sm:inline">
            Source:{' '}
            <span className="text-neutral-300">{sourceLabel(year)}</span>{' '}
            {year >= VIIRS_FROM_YEAR ? '(cleaner, 2016+)' : '(back to 2000)'}
          </span>
        </div>
      </header>

      <main className="flex-1 relative flex flex-col min-h-0 bg-neutral-950">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-lg bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg shadow-xl text-sm backdrop-blur-md"
            >
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Viewer */}
        <div className="flex-1 relative flex items-center justify-center p-4 md:p-6 overflow-hidden">
          {(loading || isExporting) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-30 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8"
            >
              <div className="max-w-md w-full space-y-4">
                <div className="text-center space-y-2">
                  {isExporting ? (
                    <Video className="w-12 h-12 text-sky-400 mx-auto animate-pulse" />
                  ) : (
                    <Satellite className="w-12 h-12 text-sky-400 mx-auto animate-pulse" />
                  )}
                  <h3 className="text-xl font-medium text-white">
                    {isExporting ? 'Exporting Video' : 'Building Timelapse'}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {isExporting ? 'Rendering frames…' : progressMsg}
                  </p>
                </div>
                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-sky-500 rounded-full"
                    animate={{
                      width: `${isExporting ? exportProgress : progress}%`,
                    }}
                    transition={{ ease: 'linear', duration: 0.2 }}
                  />
                </div>
                <p className="text-xs text-center text-neutral-500">
                  {Math.round(isExporting ? exportProgress : progress)}%
                </p>
              </div>
            </motion.div>
          )}

          {current ? (
            <div className="relative aspect-square h-full max-h-full max-w-full rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
              <img
                src={current.url}
                alt={`Satellite ${current.date}`}
                className="w-full h-full object-cover select-none"
                draggable={false}
              />
              {/* Pin */}
              {pin && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
                >
                  <span className="mb-1 px-1.5 py-0.5 text-[10px] font-semibold text-white bg-black/60 rounded whitespace-nowrap">
                    {pin.label}
                  </span>
                  <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-black shadow-md" />
                </div>
              )}
              {/* Date */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/60 text-white text-sm font-medium tabular-nums">
                {current.date}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="flex flex-col items-center justify-center text-neutral-600 gap-4">
                <Satellite className="w-12 h-12 opacity-20" />
                <p className="text-sm max-w-xs text-center">
                  Pick a place and a year to watch it from space, day by day.
                  No API key needed.
                </p>
              </div>
            )
          )}
        </div>

        {/* Timeline bar */}
        <div className="flex-none h-40 md:h-44 border-t border-neutral-800 bg-neutral-900 p-4 md:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (currentIndex >= frames.length - 1) {
                    setCurrentIndex(0);
                    setIsPlaying(true);
                  } else {
                    setIsPlaying((p) => !p);
                  }
                }}
                disabled={frames.length <= 1}
                className="w-12 h-12 rounded-full bg-sky-500 text-neutral-950 flex items-center justify-center hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" fill="currentColor" />
                ) : (
                  <Play className="w-5 h-5 ml-1" fill="currentColor" />
                )}
              </button>

              <div className="hidden md:flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1.5 ml-2">
                {SPEEDS.map((s) => (
                  <button
                    key={s.fps}
                    onClick={() => setFps(s.fps)}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                      fps === s.fps
                        ? 'bg-neutral-700 text-sky-400'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <button
                onClick={exportVideo}
                disabled={isExporting || frames.length <= 1}
                className="ml-2 flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:bg-neutral-900"
              >
                {isExporting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-500 border-t-sky-400 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-sky-400" />
                )}
                {isExporting ? 'Exporting…' : 'Export Video'}
              </button>
            </div>

            <div className="text-right">
              <p className="text-sm text-neutral-500 font-medium">
                {frames.length > 0
                  ? `Frame ${currentIndex + 1} / ${frames.length}`
                  : 'No frames yet'}
              </p>
              <div className="text-2xl md:text-3xl font-light text-white tabular-nums tracking-tight">
                {current ? current.date : '----'}
              </div>
            </div>
          </div>

          {/* Scrubber */}
          <input
            type="range"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={currentIndex}
            disabled={frames.length <= 1}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentIndex(parseInt(e.target.value, 10));
            }}
            className="w-full accent-sky-500 disabled:opacity-40"
          />
          <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            <span>{frames[0]?.date ?? ''}</span>
            <span>{frames[frames.length - 1]?.date ?? ''}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
