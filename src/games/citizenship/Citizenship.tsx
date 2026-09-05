import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Landmark,
  Trophy,
  RotateCcw,
  Play,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getQuizQuestions, QuizQuestion, TOTAL_QUESTIONS } from './questions';
import type { Screen } from './types';

// Question-count choices. "All" runs through the whole official-question pool.
const LENGTHS = [10, 20, 50, TOTAL_QUESTIONS];

// USCIS passes an applicant who gets 6 of 10 (60%) correct, so we use 60% as
// the "you'd pass" line whatever quiz length was picked.
const PASS_RATIO = 0.6;

// ---------------------------------------------------------------------------

// Sticky back bar matching the games shell chrome, so a solo game still has an
// obvious way home to the gallery.
function BackBar({ onExit }: { onExit: () => void }) {
  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-blue-100">
      <button
        onClick={onExit}
        className="flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Gallery
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StartScreen({ onStart }: { onStart: (count: number) => void }) {
  const [count, setCount] = useState(10);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center justify-center p-4 bg-blue-900 rounded-full text-white mb-5 shadow-xl">
          <Landmark size={44} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight uppercase mb-3">
          Citizenship <span className="text-red-600">Trivia</span>
        </h1>
        <p className="text-lg text-gray-600 font-medium max-w-md mx-auto">
          Practice the official USCIS civics questions from the U.S.
          naturalization test. Answer, learn the fact, and see if you'd pass.
        </p>
      </motion.div>

      <div className="bg-white shadow-2xl rounded-3xl overflow-hidden w-full border border-gray-100">
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <label className="block font-bold text-gray-800 mb-3 text-lg">
              How many questions?
            </label>
            <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-2xl p-2 border border-gray-200">
              {LENGTHS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={cn(
                    'py-3 rounded-xl font-bold transition-all text-center',
                    count === n
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  {n === TOTAL_QUESTIONS ? 'All' : n}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Questions are drawn at random from {TOTAL_QUESTIONS} official
              civics questions, and answer choices are shuffled each time.
            </p>
          </div>

          <button
            onClick={() => onStart(count)}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-bold text-xl rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            Start Quiz <Play fill="currentColor" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface QuizProps {
  questions: QuizQuestion[];
  onFinish: (score: number) => void;
}

function Quiz({ questions, onFinish }: QuizProps) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const question = questions[index];
  const answered = selected !== null;
  const isLast = index === questions.length - 1;

  const handleSelect = (option: number) => {
    if (answered) return;
    setSelected(option);
    if (option === question.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (isLast) {
      onFinish(score);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  const progress = ((index + (answered ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-8">
      {/* Progress + running score */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">
          Question <span className="text-blue-600">{index + 1}</span>
          <span className="text-gray-300"> / </span>
          {questions.length}
        </div>
        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">
          Score <span className="text-green-600">{score}</span>
        </div>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full bg-gradient-to-r from-red-600 via-blue-600 to-blue-700"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 leading-tight">
                {question.question}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.shuffledOptions.map((option, i) => {
                  const isCorrect = question.correctIndex === i;
                  const isChosen = selected === i;

                  let stateClass =
                    'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700';
                  let icon = null;

                  if (answered) {
                    if (isCorrect) {
                      stateClass = 'bg-green-100 border-green-500 text-green-800';
                      icon = <CheckCircle2 className="text-green-600" size={24} />;
                    } else if (isChosen) {
                      stateClass = 'bg-red-100 border-red-500 text-red-800';
                      icon = <XCircle className="text-red-600" size={24} />;
                    } else {
                      stateClass =
                        'bg-gray-50 border-gray-200 text-gray-400 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={answered}
                      onClick={() => handleSelect(i)}
                      className={cn(
                        'relative flex items-center justify-between w-full text-left p-5 rounded-2xl border-2 font-semibold text-lg transition-all duration-200',
                        !answered &&
                          'hover:-translate-y-1 hover:shadow-md active:translate-y-0',
                        stateClass,
                      )}
                    >
                      <span className="flex-1 pr-4">{option}</span>
                      {icon && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          {icon}
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {answered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">
                          {selected === question.correctIndex ? 'Correct!' : 'Fact'}
                        </div>
                        <p className="text-blue-900 font-medium text-lg leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>
                      <button
                        onClick={handleNext}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl hover:bg-blue-700 shadow-md transition-all hover:-translate-y-1 active:translate-y-0 shrink-0"
                      >
                        {isLast ? 'See Results' : 'Next'} <ChevronRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

// A light, dependency-free confetti burst (red/white/blue) for a passing score.
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.4,
        color: ['#ef4444', '#3b82f6', '#ffffff', '#1d4ed8'][i % 4],
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -40, opacity: 0, rotate: p.rotate }}
          animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: p.rotate + 240 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            borderRadius: 2,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.04)',
          }}
        />
      ))}
    </div>
  );
}

interface ResultsProps {
  score: number;
  total: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

function Results({ score, total, onPlayAgain, onExit }: ResultsProps) {
  const pct = Math.round((score / total) * 100);
  const passed = score / total >= PASS_RATIO;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8 flex flex-col items-center">
      {passed && <Confetti />}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-10 relative z-10"
      >
        <div
          className={cn(
            'inline-flex items-center justify-center p-6 rounded-full mb-6 shadow-xl',
            passed
              ? 'bg-yellow-400 text-yellow-900 shadow-yellow-400/40'
              : 'bg-blue-100 text-blue-700',
          )}
        >
          <Trophy size={56} />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight uppercase mb-3">
          {passed ? "You'd Pass!" : 'Keep Studying'}
        </h1>
        <p className="text-xl text-gray-600 font-medium">
          {passed
            ? 'Nicely done — that clears the USCIS 60% mark.'
            : 'The USCIS test needs 60% correct. Give it another run!'}
        </p>
      </motion.div>

      <div className="w-full bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-100 relative z-10">
        <div className="p-8 md:p-10 flex flex-col items-center text-center border-b border-gray-100">
          <div className="text-7xl font-black tracking-tighter text-blue-600">
            {score}
            <span className="text-3xl text-gray-300"> / {total}</span>
          </div>
          <div className="mt-2 text-lg font-bold text-gray-500 uppercase tracking-widest">
            {pct}% correct
          </div>
        </div>

        <div className="bg-gray-50 p-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            <RotateCcw size={20} /> Play Again
          </button>
          <button
            onClick={onExit}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 font-bold text-lg rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
          >
            <ArrowLeft size={20} /> Gallery
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function Citizenship({ onExit }: { onExit: () => void }) {
  const [screen, setScreen] = useState<Screen>('start');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [score, setScore] = useState(0);

  const start = (count: number) => {
    setQuestions(getQuizQuestions(count));
    setScore(0);
    setScreen('playing');
  };

  const finish = (finalScore: number) => {
    setScore(finalScore);
    setScreen('results');
  };

  // Keep the quiz starting from the top on each fresh screen.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200 selection:text-blue-900 flex flex-col">
      <BackBar onExit={onExit} />

      {/* Patriotic background accent */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-white to-blue-700" />
        <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-blue-50/60 to-transparent" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center py-10">
        <AnimatePresence mode="wait">
          {screen === 'start' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <StartScreen onStart={start} />
            </motion.div>
          )}

          {screen === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="w-full"
            >
              <Quiz questions={questions} onFinish={finish} />
            </motion.div>
          )}

          {screen === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <Results
                score={score}
                total={questions.length}
                onPlayAgain={() => setScreen('start')}
                onExit={onExit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 py-6 text-center text-sm font-medium text-gray-400">
        Practice quiz · Official USCIS civics questions
      </footer>
    </div>
  );
}
