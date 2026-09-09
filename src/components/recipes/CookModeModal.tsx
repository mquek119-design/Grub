'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/media/Icon';
import { Stocky } from '@/components/mascot/Stocky';
import { clsx } from '@/lib/clsx';
import type { Recipe } from '@/lib/types';
import { formatRecipeTitle, formatInstruction } from '@/lib/recipeFormatting';

interface CookModeModalProps {
  recipe: Recipe;
  servings: number;
  onClose: () => void;
}

/**
 * Categorizes an instruction into a primary cooking phase for the Anki flashcard badge.
 */
function getStepPhase(instruction: string): { label: string; icon: string; tone: string } {
  const lower = instruction.toLowerCase();
  if (/\b(chop|dice|slice|peel|grate|prep|trim|finely|mince|shred)\b/.test(lower)) {
    return { label: 'PREP', icon: 'content_cut', tone: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' };
  }
  if (/\b(sear|fry|saut[eé]|brown|pan-fry|crisp|heat\s+oil|skillet|sizzle)\b/.test(lower)) {
    return { label: 'SEAR', icon: 'local_fire_department', tone: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30' };
  }
  if (/\b(boil|simmer|reduce|bubble|poach|steam|stock|broth)\b/.test(lower)) {
    return { label: 'SIMMER', icon: 'soup_kitchen', tone: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30' };
  }
  if (/\b(bake|roast|oven|preheat|grill|broil|sheet)\b/.test(lower)) {
    return { label: 'BAKE', icon: 'skillet', tone: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30' };
  }
  if (/\b(stir|mix|whisk|combine|fold|toss|blend|puree)\b/.test(lower)) {
    return { label: 'MIX', icon: 'restaurant', tone: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30' };
  }
  if (/\b(season|taste|salt|pepper|garnish|drizzle|lemon|herb|coriander|parsley)\b/.test(lower)) {
    return { label: 'SEASON', icon: 'grain', tone: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30' };
  }
  if (/\b(serve|plate|rest|carve|enjoy|bowl|divide|dish\s+up)\b/.test(lower)) {
    return { label: 'SERVE', icon: 'dinner_dining', tone: 'bg-secondary-fixed text-on-secondary-fixed border-secondary/30' };
  }
  return { label: 'COOK', icon: 'skillet', tone: 'bg-primary/10 text-primary border-primary/20' };
}

/**
 * Extracts a countdown duration in seconds from step text (e.g. "10 mins" -> 600).
 */
function extractStepTimer(instruction: string): number | null {
  const match = instruction.match(/(\d+)(?:-(\d+))?\s*(mins?|minutes?|secs?|seconds?|hours?)\b/i);
  if (!match) return null;
  const num = parseInt(match[2] ?? match[1], 10);
  const unit = match[3].toLowerCase();
  if (unit.startsWith('hour')) return num * 3600;
  if (unit.startsWith('min')) return num * 60;
  if (unit.startsWith('sec')) return num;
  return null;
}

/**
 * Matches ingredients mentioned in this specific step instruction.
 */
function getStepIngredients(instruction: string, ingredients: Recipe['ingredients'], scale: number) {
  const lower = instruction.toLowerCase();
  return ingredients.filter((ing) => {
    const nameWords = ing.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return nameWords.some((w) => lower.includes(w)) || lower.includes(ing.name.toLowerCase());
  }).map((ing) => {
    const qty = ing.quantity * scale;
    const display = qty % 1 === 0 ? qty.toString() : qty.toFixed(1);
    return {
      name: ing.name,
      amount: `${display} ${ing.unit}`.trim(),
    };
  });
}

function playTimerChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio unavailable or muted
  }
}

export function CookModeModal({ recipe, servings, onClose }: CookModeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [viewMode, setViewMode] = useState<'deck' | 'list'>('deck');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  // Anki Flashcard State
  const [currentStep, setCurrentStep] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([0]));
  const [finished, setFinished] = useState(false);
  const [deckDrawerOpen, setDeckDrawerOpen] = useState(false);

  // Step Timer State
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Touch Swipe Gesture Handling for Mobile Flashcards
  const [dragX, setDragX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef(false);

  const instructions = recipe.instructions || [];
  const totalSteps = instructions.length;
  const effectiveServings = Math.max(1, servings || recipe.servings || 1);
  const baseServings = Math.max(1, recipe.servings || 1);
  const scale = effectiveServings / baseServings;
  const activeInstruction = instructions[currentStep] || '';

  const stepPhase = useMemo(() => getStepPhase(activeInstruction), [activeInstruction]);
  const stepIngredients = useMemo(
    () => getStepIngredients(activeInstruction, recipe.ingredients || [], scale),
    [activeInstruction, recipe.ingredients, scale]
  );
  const detectedSeconds = useMemo(() => extractStepTimer(activeInstruction), [activeInstruction]);

  // Prevent background body scroll while Cook Mode is active on mobile
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Reset timer and flip state on card advance
  useEffect(() => {
    setIsFlipped(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (detectedSeconds !== null) {
      setTimerSecondsLeft(detectedSeconds);
      setTimerRunning(false);
    } else {
      setTimerSecondsLeft(null);
      setTimerRunning(false);
    }
  }, [currentStep, detectedSeconds]);

  // Countdown clock effect
  useEffect(() => {
    if (!timerRunning || timerSecondsLeft === null) return;
    timerIntervalRef.current = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerIntervalRef.current as NodeJS.Timeout);
          setTimerRunning(false);
          playTimerChime();
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate([200, 100, 200]);
            } catch {
              // Ignore device vibration restrictions
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, timerSecondsLeft]);

  // Screen size check for desktop prompt
  useEffect(() => {
    setMounted(true);
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Screen Wake Lock API for Mobile Cook Mode with safe cleanup
  useEffect(() => {
    let wakeLock: any = null;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      (navigator as any).wakeLock
        ?.request?.('screen')
        ?.then((lock: any) => {
          wakeLock = lock;
        })
        ?.catch((err: any) => console.log('Wake Lock error:', err));
    }
    return () => {
      if (wakeLock && typeof wakeLock.release === 'function') {
        try {
          wakeLock.release().catch(() => {});
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (finished) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === ' ' || e.key === 'f') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, totalSteps, finished]);

  function handleSelectStep(idx: number) {
    setCurrentStep(idx);
    setCompletedSteps((prev) => new Set(prev).add(idx));
    setDeckDrawerOpen(false);
  }

  function handlePrevStep() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  function handleNextStep() {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));

    if (currentStep < totalSteps - 1) {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      setCompletedSteps((prev) => new Set(prev).add(nextIdx));
    } else {
      // Finished all cards in deck
      setCompletedSteps(new Set(Array.from({ length: totalSteps }, (_, i) => i)));
      setFinished(true);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (!e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSwiping(true);
    didSwipeRef.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStartRef.current || !e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragX(diffX);
      if (Math.abs(diffX) > 10) {
        didSwipeRef.current = true;
      }
    }
  }

  function handleTouchEnd() {
    if (!touchStartRef.current) return;
    const threshold = 50;
    if (dragX < -threshold) {
      handleNextStep();
    } else if (dragX > threshold) {
      handlePrevStep();
    }

    setDragX(0);
    setIsSwiping(false);
    touchStartRef.current = null;
  }

  function handleTouchCancel() {
    setDragX(0);
    setIsSwiping(false);
    touchStartRef.current = null;
    didSwipeRef.current = false;
  }

  const cookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/recipes/${recipe.id}?cook=true`
    : `/recipes/${recipe.id}?cook=true`;

  // Format timer minutes/seconds
  const timerMins = timerSecondsLeft !== null ? Math.floor(timerSecondsLeft / 60) : 0;
  const timerSecs = timerSecondsLeft !== null ? timerSecondsLeft % 60 : 0;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] bg-[#121B17] text-white flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden select-none">
      {/* Optional QR Code modal to beam to phone */}
      {showQrModal && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-container-lowest text-on-surface border border-surface-container-highest rounded-2xl p-5 max-w-xs w-full shadow-ambient-modal flex flex-col items-center text-center gap-3 relative animate-pop-in">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              <Icon name="close" className="text-lg" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-xs mt-1">
              <Icon name="smartphone" filled className="text-[20px]" />
            </div>

            <div className="flex flex-col gap-0.5">
              <h2 className="font-title-md text-base font-bold text-on-surface">
                Cook on your phone
              </h2>
              <p className="font-body-sm text-[12px] text-on-surface-variant max-w-[240px]">
                Scan to open this recipe hands-free on your phone.
              </p>
            </div>

            <div className="w-full bg-surface-container-low border border-surface-container-highest/60 rounded-xl p-3 flex flex-col items-center gap-1.5">
              <div className="p-1.5 bg-white rounded-lg shadow-xs border border-outline-variant/30">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(cookUrl)}&color=1B4332&bgcolor=FFFFFF`}
                  alt="Scan to open Cook Mode on your phone"
                  width={110}
                  height={110}
                  className="rounded-md"
                />
              </div>
              <span className="font-label-caps text-[9px] uppercase tracking-wider text-on-surface-variant/80 font-semibold">
                Point phone camera to start
              </span>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(cookUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }
                }}
                className="w-full h-9 rounded-lg bg-primary text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 btn-tactile shadow-xs"
              >
                <Icon name={copiedLink ? 'check' : 'content_copy'} className="text-[15px]" />
                <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Deck Bar */}
      <header className="px-md py-sm flex flex-col gap-2 shrink-0 bg-[#0E1512] border-b border-white/10">
        <div className="flex items-center justify-between gap-sm">
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit Cook Mode"
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Icon name="close" className="text-xl" />
          </button>
          <div className="flex items-center gap-1 p-0.5 bg-white/10 rounded-full border border-white/15">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'deck'}
              onClick={() => setViewMode('deck')}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all',
                viewMode === 'deck'
                  ? 'bg-secondary text-on-secondary-container shadow-xs'
                  : 'text-white/70 hover:text-white'
              )}
            >
              <Icon name="style" className="text-[14px]" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all',
                viewMode === 'list'
                  ? 'bg-secondary text-on-secondary-container shadow-xs'
                  : 'text-white/70 hover:text-white'
              )}
            >
              <Icon name="checklist" className="text-[14px]" />
              <span>Checklist</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {isDesktop && (
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                aria-label="Show phone QR code"
                className="h-9 px-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Open on phone"
              >
                <Icon name="qr_code_2" className="text-[16px]" />
                <span className="hidden sm:inline">Phone QR</span>
              </button>
            )}

            {viewMode === 'deck' ? (
              <button
                type="button"
                onClick={() => setDeckDrawerOpen(true)}
                aria-label="Deck overview & ingredients"
                className="h-9 px-3 rounded-full bg-white/10 hover:bg-white/15 text-white/90 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Icon name="layers" className="text-[16px]" />
                <span>Deck</span>
              </button>
            ) : (
              <span className="font-numeric-data text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/90 font-bold">
                {effectiveServings} portions
              </span>
            )}
          </div>
        </div>

        {/* Header Progress Bar */}
        {viewMode === 'deck' ? (
          <div className="flex items-center gap-1.5 w-full">
            {Array.from({ length: totalSteps }).map((_, idx) => {
              const isDone = completedSteps.has(idx);
              const isCurrent = currentStep === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectStep(idx)}
                  aria-label={`Jump to Card ${idx + 1}`}
                  className={clsx(
                    'h-1.5 flex-1 rounded-full transition-all duration-300',
                    isCurrent
                      ? 'bg-secondary ring-2 ring-secondary/40 shadow-xs'
                      : isDone
                      ? 'bg-[#2D6A4F]'
                      : 'bg-white/20'
                  )}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 text-xs w-full pt-0.5">
            <div className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-secondary transition-all duration-300 rounded-full"
                style={{ width: `${(completedSteps.size / totalSteps) * 100}%` }}
              />
            </div>
            <span className="font-numeric-data text-[11px] text-[#A3C4A8] font-bold shrink-0">
              {completedSteps.size}/{totalSteps} steps completed
            </span>
          </div>
        )}
      </header>

      {viewMode === 'deck' ? (
        <>
          {/* Anki Flashcard Center Stage */}
          <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
            <div className="relative w-full max-w-md mx-auto flex flex-col justify-center">
              {/* Layered Card 3 (Bottom Deck Shadow) */}
              <div className="absolute -bottom-4 inset-x-6 h-full rounded-3xl bg-[#1C2C24] border border-white/5 -z-20 opacity-40 shadow-xs pointer-events-none" />

              {/* Layered Card 2 (Middle Deck Shadow) */}
              <div className="absolute -bottom-2 inset-x-3 h-full rounded-3xl bg-[#23382E] border border-white/10 -z-10 opacity-75 shadow-sm pointer-events-none" />

              {/* Active Flashcard */}
              <div
                onClick={() => {
                  if (didSwipeRef.current) {
                    didSwipeRef.current = false;
                    return;
                  }
                  setIsFlipped((prev) => !prev);
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                style={{
                  transform: dragX !== 0 ? `translateX(${dragX}px) rotate(${dragX * 0.035}deg)` : undefined,
                  transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
                className={clsx(
                  'w-full min-h-[340px] max-h-[68vh] sm:min-h-[420px] flex flex-col justify-between p-5 sm:p-8 rounded-3xl transition-all duration-200 cursor-pointer shadow-ambient-modal border touch-pan-y relative select-none',
                  isFlipped
                    ? 'bg-[#1E2E25] border-secondary/50 text-white ring-1 ring-secondary/30'
                    : 'bg-[#FAF7F2] text-[#1B4332] border-white/20 shadow-2xl'
                )}
              >
                {/* Swipe Direction Overlay Cues */}
                {dragX < -25 && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-lg animate-fade-in pointer-events-none">
                    <span>Next Card</span>
                    <Icon name="arrow_forward" className="text-sm" />
                  </div>
                )}
                {dragX > 25 && (
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white backdrop-blur-md text-xs font-bold shadow-lg animate-fade-in pointer-events-none">
                    <Icon name="arrow_back" className="text-sm" />
                    <span>Previous Card</span>
                  </div>
                )}
                {/* Flashcard Header */}
                <div className="flex items-center justify-between gap-sm shrink-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider font-label-caps border flex items-center gap-1',
                        isFlipped
                          ? 'bg-secondary-fixed/20 text-secondary border-secondary/30'
                          : stepPhase.tone
                      )}
                    >
                      <Icon name={stepPhase.icon} className="text-xs" />
                      <span>{isFlipped ? 'INGREDIENTS & TECHNIQUE' : stepPhase.label}</span>
                    </span>
                    <span className={clsx('font-label-caps text-xs font-bold', isFlipped ? 'text-white/60' : 'text-[#2D6A4F]/70')}>
                      STEP {String(currentStep + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div
                    className={clsx(
                      'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors',
                      isFlipped
                        ? 'bg-white/10 text-white border-white/20'
                        : 'bg-[#1B4332]/10 text-[#1B4332] border-[#1B4332]/20'
                    )}
                  >
                    <Icon name="flip_to_back" className="text-sm" />
                    <span>{isFlipped ? 'Flip to Action' : 'Flip Details'}</span>
                  </div>
                </div>

                {/* Flashcard Core Content */}
                <div className="flex-1 flex flex-col justify-center my-4 overflow-y-auto pr-1">
                  {!isFlipped ? (
                    /* FRONT: Big, bold knuckle-friendly action text */
                    <div className="flex flex-col gap-4">
                      <p className="font-headline-sm sm:font-headline-md text-[22px] sm:text-[26px] font-bold leading-snug tracking-tight">
                        {formatInstruction(activeInstruction)}
                      </p>

                      {/* Step Ingredients Chips */}
                      {stepIngredients.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {stepIngredients.map((item, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20"
                            >
                              <Icon name="check" className="text-xs text-[#2D6A4F]" />
                              <span>{item.name}:</span>
                              <span className="font-numeric-data">{item.amount}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Flashcard Knuckle Timer Pill if detected */}
                      {timerSecondsLeft !== null && (
                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTimerRunning((prev) => !prev);
                            }}
                            className={clsx(
                              'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold shadow-md transition-transform active:scale-95',
                              timerRunning
                                ? 'bg-secondary text-on-secondary-container animate-pulse'
                                : 'bg-[#1B4332] text-white'
                            )}
                          >
                            <Icon name={timerRunning ? 'pause' : 'timer'} className="text-lg" />
                            <span>
                              {timerRunning
                                ? `${timerMins}m ${String(timerSecs).padStart(2, '0')}s Left`
                                : `Start ${Math.round(detectedSeconds! / 60)}m Timer`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* BACK: Flashcard Answer / Recipe Technique & Full Ingredients Breakdown */
                    <div className="flex flex-col gap-3 text-left">
                      <span className="font-label-caps text-xs uppercase tracking-wider text-secondary font-bold">
                        Ingredients for this recipe ({effectiveServings} portions):
                      </span>
                      <ul className="grid grid-cols-1 gap-1.5 max-h-[36vh] overflow-y-auto pr-1">
                        {recipe.ingredients.map((ing) => {
                          const qty = ing.quantity * scale;
                          const display = qty % 1 === 0 ? qty.toString() : qty.toFixed(1);
                          const isMentioned = activeInstruction.toLowerCase().includes(ing.name.toLowerCase());
                          return (
                            <li
                              key={ing.ingredientId}
                              className={clsx(
                                'flex items-center justify-between text-xs p-2 rounded-xl border transition-colors',
                                isMentioned
                                  ? 'bg-secondary/20 border-secondary/40 text-white font-bold'
                                  : 'bg-white/5 border-white/10 text-white/80'
                              )}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Icon
                                  name={isMentioned ? 'check_circle' : 'circle'}
                                  className={clsx('text-xs', isMentioned ? 'text-secondary' : 'text-white/40')}
                                />
                                <span className="truncate">{ing.name}</span>
                              </span>
                              <span className="font-numeric-data font-bold shrink-0 ml-2 text-white">
                                {display} {ing.unit}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5 mt-1">
                        <div className="shrink-0 mt-0.5">
                          <Stocky mood="smug" size="sm" />
                        </div>
                        <p className="text-xs text-white/90 leading-relaxed">
                          <strong>Stocky&apos;s Cooking Tip:</strong> Keep heat consistent. Tap anywhere to flip back to the step action.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Flashcard Footer Tip */}
                <div className="flex items-center justify-between text-xs shrink-0 pt-2 border-t border-black/10 dark:border-white/10">
                  <span className={clsx('font-label-caps text-[11px] font-semibold flex items-center gap-1.5', isFlipped ? 'text-white/60' : 'text-[#2D6A4F]/80')}>
                    <Icon name="swipe" className="text-sm opacity-80" />
                    Swipe left/right to change card · Tap to flip
                  </span>
                  <span className={clsx('font-numeric-data text-xs font-bold', isFlipped ? 'text-secondary' : 'text-[#1B4332]')}>
                    {effectiveServings} Servings
                  </span>
                </div>
              </div>
            </div>
          </main>

          {/* Anki Bottom Action Bar (Knuckle-Friendly with Android Home Button Clearance) */}
          <footer className="px-md pt-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))] shrink-0 bg-[#0E1512] border-t border-white/10 shadow-2xl">
            <div className="max-w-md mx-auto flex items-center gap-2">
              {/* Previous Card */}
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={handlePrevStep}
                aria-label="Previous step card"
                className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0"
              >
                <Icon name="arrow_back" className="text-xl" />
              </button>

              {/* Flip Toggle Button */}
              <button
                type="button"
                onClick={() => setIsFlipped((prev) => !prev)}
                className="h-14 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Icon name="sync_alt" className="text-base" />
                <span>Flip</span>
              </button>

              {/* Anki Next / Good Button */}
              <button
                type="button"
                onClick={handleNextStep}
                className={clsx(
                  'flex-1 h-14 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98',
                  currentStep === totalSteps - 1
                    ? 'bg-secondary hover:bg-secondary/90 text-on-secondary-container text-base'
                    : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-base'
                )}
              >
                {currentStep === totalSteps - 1 ? (
                  <>
                    <Icon name="verified" className="text-xl" />
                    <span>Finish Cooking 🎉</span>
                  </>
                ) : (
                  <>
                    <span>Done · Next Step</span>
                    <Icon name="arrow_forward" className="text-xl" />
                  </>
                )}
              </button>
            </div>
          </footer>
        </>
      ) : (
        /* Regular Recipe & Instructions Checklist View */
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-6">
          {/* Ingredients Prep Checklist Card */}
          <section className="bg-[#18241F] border border-white/10 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between gap-sm">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/20 text-primary">
                  <Icon name="kitchen" className="text-lg" />
                </span>
                <h3 className="font-title-md text-base font-bold text-white">
                  Ingredients Prep Checklist
                </h3>
              </div>
              <span className="font-numeric-data text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/80 font-bold">
                {checkedIngredients.size} / {recipe.ingredients.length} ready
              </span>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Tick ingredients off as you pull them from the fridge & pantry:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {recipe.ingredients.map((ing, idx) => {
                const isChecked = checkedIngredients.has(idx);
                const qty = ing.quantity * scale;
                const display = qty % 1 === 0 ? qty.toString() : qty.toFixed(1);

                return (
                  <li key={ing.ingredientId || idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckedIngredients((prev) => {
                          const next = new Set(prev);
                          if (next.has(idx)) next.delete(idx);
                          else next.add(idx);
                          return next;
                        });
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between p-2.5 rounded-2xl border text-left transition-all',
                        isChecked
                          ? 'bg-white/5 border-white/10 text-white/40 line-through'
                          : 'bg-[#1E2E25] border-white/15 text-white hover:border-secondary/50'
                      )}
                    >
                      <span className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span
                          className={clsx(
                            'size-5 rounded-lg flex items-center justify-center border shrink-0 transition-colors',
                            isChecked
                              ? 'bg-secondary border-secondary text-on-secondary'
                              : 'border-white/30 bg-white/5'
                          )}
                        >
                          {isChecked && <Icon name="check" className="text-xs font-bold" />}
                        </span>
                        <span className="text-xs font-semibold truncate">{ing.name}</span>
                      </span>
                      <span className="font-numeric-data text-xs font-bold shrink-0 text-white/90">
                        {display} {ing.unit}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Step-by-Step Instructions Checklist */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-title-md text-base font-bold text-white flex items-center gap-2">
                <Icon name="format_list_numbered" className="text-secondary text-lg" />
                <span>Cooking Steps Checklist</span>
              </h3>
              <span className="font-label-caps text-xs text-[#A3C4A8] font-bold">
                {completedSteps.size} of {totalSteps} completed
              </span>
            </div>

            <div className="space-y-3">
              {recipe.instructions.map((instruction, idx) => {
                const isDone = completedSteps.has(idx);
                const phase = getStepPhase(instruction);
                const timerSecs = extractStepTimer(instruction);
                const isTimerRunningForThisStep = timerRunning && currentStep === idx;

                return (
                  <div
                    key={idx}
                    className={clsx(
                      'p-4 sm:p-5 rounded-2xl border transition-all duration-200',
                      isDone
                        ? 'bg-[#15201B] border-white/10 opacity-75'
                        : 'bg-[#1E2E25] border-white/20 shadow-md ring-1 ring-white/5'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Step Checkbox Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setCompletedSteps((prev) => {
                            const next = new Set(prev);
                            if (next.has(idx)) next.delete(idx);
                            else next.add(idx);
                            return next;
                          });
                        }}
                        aria-label={`Mark step ${idx + 1} as ${isDone ? 'incomplete' : 'complete'}`}
                        className={clsx(
                          'size-8 rounded-xl flex items-center justify-center border font-bold text-xs shrink-0 mt-0.5 transition-all active:scale-90',
                          isDone
                            ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white shadow-xs'
                            : 'border-white/30 bg-white/10 text-white/80 hover:border-secondary'
                        )}
                      >
                        {isDone ? <Icon name="check" className="text-sm font-bold" /> : idx + 1}
                      </button>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold font-label-caps uppercase border flex items-center gap-1', phase.tone)}>
                            <Icon name={phase.icon} className="text-[11px]" />
                            <span>{phase.label}</span>
                          </span>
                          <span className="font-label-caps text-xs text-white/60 font-semibold">
                            Step {idx + 1}
                          </span>
                        </div>

                        <p className={clsx('text-[15px] sm:text-base leading-relaxed text-white font-medium', isDone && 'line-through text-white/60')}>
                          {instruction}
                        </p>

                        {/* Inline Step Timer if detected */}
                        {timerSecs !== null && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentStep(idx);
                                if (isTimerRunningForThisStep) {
                                  setTimerRunning(false);
                                } else {
                                  setTimerSecondsLeft(timerSecs);
                                  setTimerRunning(true);
                                }
                              }}
                              className={clsx(
                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95',
                                isTimerRunningForThisStep
                                  ? 'bg-secondary text-on-secondary-container animate-pulse'
                                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
                              )}
                            >
                              <Icon name={isTimerRunningForThisStep ? 'pause' : 'timer'} className="text-sm" />
                              <span>
                                {isTimerRunningForThisStep && timerSecondsLeft !== null
                                  ? `${Math.floor(timerSecondsLeft / 60)}m ${String(timerSecondsLeft % 60).padStart(2, '0')}s Left`
                                  : `Start ${Math.round(timerSecs / 60)}m timer`}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Finish / Complete Button in Checklist Mode */}
          <div className="pt-2 pb-[max(2.5rem,calc(env(safe-area-inset-bottom,0px)+2rem))]">
            <button
              type="button"
              onClick={() => {
                setCompletedSteps(new Set(Array.from({ length: totalSteps }, (_, i) => i)));
                setFinished(true);
              }}
              className="w-full py-4 rounded-2xl bg-secondary text-on-secondary-container font-title-md text-base font-bold shadow-lg flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all"
            >
              <Icon name="verified" className="text-xl" />
              <span>Finish Cooking & Save Portions 🎉</span>
            </button>
          </div>
        </main>
      )}

      {/* Deck Overview & Ingredients Drawer */}
      {deckDrawerOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in">
          <div className="bg-[#18241F] border-t border-white/20 rounded-t-3xl p-md w-full max-w-md max-h-[80vh] overflow-y-auto flex flex-col gap-md text-white pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1rem))] animate-fade-in-up">
            <div className="flex items-center justify-between pb-sm border-b border-white/10">
              <div className="flex items-center gap-2">
                <Icon name="layers" className="text-secondary text-lg" />
                <h3 className="font-title-md text-title-md font-bold text-white">Recipe Deck Overview</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeckDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            <div className="flex flex-col gap-xs">
              <span className="font-label-caps text-xs uppercase tracking-wider text-[#A3C4A8] font-bold">
                Jump to Card ({completedSteps.size}/{totalSteps} Done):
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {recipe.instructions.map((step, idx) => {
                  const isDone = completedSteps.has(idx);
                  const isCurrent = currentStep === idx;
                  const phase = getStepPhase(step);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectStep(idx)}
                      className={clsx(
                        'flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all',
                        isCurrent
                          ? 'bg-secondary/20 border-secondary text-white font-bold'
                          : isDone
                          ? 'bg-white/5 border-white/10 text-white/70'
                          : 'bg-white/5 border-white/10 text-white/90'
                      )}
                    >
                      <span
                        className={clsx(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          isCurrent
                            ? 'bg-secondary text-on-secondary-container'
                            : isDone
                            ? 'bg-[#2D6A4F] text-white'
                            : 'bg-white/10 text-white/60'
                        )}
                      >
                        {isDone ? <Icon name="check" className="text-xs" /> : idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-white/80 truncate flex-1">
                        [{phase.label}] {step}
                      </span>
                      {isCurrent && <span className="text-[10px] uppercase font-bold text-secondary">Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDeckDrawerOpen(false)}
              className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors mt-2"
            >
              Resume Cooking
            </button>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {finished && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-md animate-fade-in">
          <div className="bg-[#FAF7F2] text-[#1B4332] border border-outline-variant/40 rounded-3xl p-lg max-w-md w-full shadow-ambient-modal flex flex-col items-center text-center gap-md">
            <div className="w-16 h-16 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
              <Icon name="verified" filled className="text-[36px]" />
            </div>

            <h3 className="font-headline-sm text-headline-sm font-bold text-[#1B4332]">
              All Cards Mastered! 🎉
            </h3>
            <p className="font-body-sm text-body-md text-[#2D6A4F]">
              You completed all {totalSteps} cards for <strong className="text-[#1B4332]">{formatRecipeTitle(recipe.title)}</strong>.
            </p>

            <div className="flex flex-col gap-sm w-full">
              <a
                href="/leftovers"
                className="w-full py-md rounded-2xl bg-secondary text-on-secondary-container font-title-md text-title-md font-bold btn-tactile flex items-center justify-center gap-xs shadow-md"
              >
                <Icon name="soup_kitchen" className="text-xl" />
                <span>+ Put Extra Portions in Leftovers</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-md rounded-2xl bg-surface-container-high text-[#1B4332] font-title-md text-title-md font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
