"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, AnimatePresence } from "motion/react";
import BrandButton from "@/components/BrandButton";
import UserInfoForm from "@/components/UserInfoForm";
import SuccessCelebration from "@/components/SuccessCelebration";
import {
  BETTER_LUCK,
  DEFAULT_PRIZES,
  PRIZE_CONFIG_VERSION,
  PRIZE_LIMITS,
  SLICE_DEG,
  SPIN_DURATION_MS,
} from "@/lib/prizes";
import type { FlowPhase } from "@/lib/flow";
import {
  submitParticipant,
  type ParticipantPayload,
} from "@/lib/participants";
import "@/styles/wheel.css";
import "@/styles/flow.css";

const PRIZE_STORAGE_KEY = "winningPrize";
const PRIZE_VERSION_KEY = "prizeConfigVersion";
const DESIGN_W = 1080;
const DESIGN_H = 1920;
const SUCCESS_HOLD_MS = 2400;

const LEGACY_COUNT_KEYS = ["CWM", "YPA", "HS", "GCS", "AED", "MB"];

function resetPrizeStorage() {
  localStorage.setItem(PRIZE_STORAGE_KEY, JSON.stringify([...DEFAULT_PRIZES]));
  localStorage.setItem(PRIZE_VERSION_KEY, PRIZE_CONFIG_VERSION);

  for (const key of LEGACY_COUNT_KEYS) {
    localStorage.removeItem(key);
  }
  for (const { key } of Object.values(PRIZE_LIMITS)) {
    localStorage.removeItem(key);
  }
}

function loadPrizes(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_PRIZES];

  const version = localStorage.getItem(PRIZE_VERSION_KEY);
  if (version !== PRIZE_CONFIG_VERSION) {
    resetPrizeStorage();
    return [...DEFAULT_PRIZES];
  }

  const stored = localStorage.getItem(PRIZE_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as string[];
    } catch {
      resetPrizeStorage();
      return [...DEFAULT_PRIZES];
    }
  }

  return [...DEFAULT_PRIZES];
}

function getWinCount(key: string): number {
  const value = localStorage.getItem(key);
  return value ? parseInt(value, 10) : 0;
}

export default function SpinWheel() {
  const [prizes, setPrizes] = useState<string[]>([...DEFAULT_PRIZES]);
  const [spinning, setSpinning] = useState(false);
  const [phase, setPhase] = useState<FlowPhase>("game");
  const [modalPrize, setModalPrize] = useState("CX Day<br />Surprise");
  const [hydrated, setHydrated] = useState(false);
  const [scale, setScale] = useState(1);
  const [formSession, setFormSession] = useState(0);

  const totalRotation = useRef(0);
  const controls = useAnimationControls();
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const lossSoundRef = useRef<HTMLAudioElement | null>(null);
  const loopHandlerRef = useRef<(() => void) | null>(null);

  const overlayOpen = phase !== "game";

  useEffect(() => {
    setPrizes(loadPrizes());
    setHydrated(true);

    const updateScale = () => {
      const next = Math.min(
        window.innerWidth / DESIGN_W,
        window.innerHeight / DESIGN_H,
      );
      setScale(next);
    };
    updateScale();
    window.addEventListener("resize", updateScale);

    const preventPinchZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault();
      }
    };

    document.addEventListener("touchstart", preventPinchZoom, {
      passive: false,
    });
    document.addEventListener("touchmove", preventPinchZoom, {
      passive: false,
    });

    return () => {
      window.removeEventListener("resize", updateScale);
      document.removeEventListener("touchstart", preventPinchZoom);
      document.removeEventListener("touchmove", preventPinchZoom);
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const stopSpinSound = useCallback(() => {
    const spinSound = spinSoundRef.current;
    if (!spinSound) return;
    if (loopHandlerRef.current) {
      spinSound.removeEventListener("ended", loopHandlerRef.current);
      loopHandlerRef.current = null;
    }
    spinSound.pause();
    spinSound.currentTime = 0;
  }, []);

  const playSoundLoop = useCallback(() => {
    const spinSound = spinSoundRef.current;
    if (!spinSound) return;

    stopSpinSound();

    const onEnded = () => {
      spinSound.currentTime = 0;
      void spinSound.play();
    };
    loopHandlerRef.current = onEnded;
    spinSound.addEventListener("ended", onEnded);
    spinSound.currentTime = 0;
    void spinSound.play();
  }, [stopSpinSound]);

  const playResultSound = useCallback((isWin: boolean) => {
    if (isWin) {
      const winSound = winSoundRef.current;
      if (!winSound) return;
      winSound.currentTime = 0;
      void winSound.play();
    } else {
      const lossSound = lossSoundRef.current;
      if (!lossSound) return;
      lossSound.currentTime = 0;
      void lossSound.play();
    }
  }, []);

  const convertSlices = useCallback((prizeText: string) => {
    setPrizes((current) => {
      const next = current.map((p) => (p === prizeText ? BETTER_LUCK : p));
      localStorage.setItem(PRIZE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const returnToGame = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    setPhase("game");
    setModalPrize("CX Day<br />Surprise");
    setFormSession((n) => n + 1);
    totalRotation.current = 0;
    void controls.set({ rotate: 0 });
  }, [controls]);

  const handleSpin = useCallback(async () => {
    if (spinning || phase !== "game") return;
    setSpinning(true);

    const randomSpin = Math.floor(Math.random() * 360) + 3700;
    totalRotation.current += randomSpin;
    const rotation = totalRotation.current;

    playSoundLoop();

    await controls.start({
      rotate: rotation,
      transition: {
        duration: SPIN_DURATION_MS / 1000,
        ease: [0.25, 0.1, 0.25, 1],
      },
    });

    const normalizedRotation = rotation % 360;
    const sliceBuffer = 0.5;
    const adjustedRotation =
      (360 - (normalizedRotation + SLICE_DEG / 2) + sliceBuffer) % 360;

    let prizeIndex = Math.floor(adjustedRotation / SLICE_DEG) % prizes.length;
    if (prizeIndex < 0) {
      prizeIndex += prizes.length;
    }

    const selectedPrize = prizes[prizeIndex] ?? BETTER_LUCK;

    stopSpinSound();
    playResultSound(selectedPrize !== BETTER_LUCK);

    const limit = PRIZE_LIMITS[selectedPrize as keyof typeof PRIZE_LIMITS];
    if (limit) {
      const count = getWinCount(limit.key) + 1;
      localStorage.setItem(limit.key, String(count));
      setModalPrize(selectedPrize);
      setPhase("reward");
      if (count === limit.max) {
        setTimeout(() => convertSlices(selectedPrize), 500);
      }
    } else {
      setModalPrize(selectedPrize);
      setPhase("reward");
    }

    setSpinning(false);
  }, [
    controls,
    convertSlices,
    phase,
    playResultSound,
    playSoundLoop,
    prizes,
    spinning,
    stopSpinSound,
  ]);

  const handleOpenForm = useCallback(() => {
    setPhase("form");
  }, []);

  const handleParticipantSubmit = useCallback(
    async (data: ParticipantPayload) => {
      setPhase("submitting");
      try {
        await submitParticipant(data);
        setPhase("success");
        successTimerRef.current = setTimeout(() => {
          returnToGame();
        }, SUCCESS_HOLD_MS);
      } catch {
        // Keep user on form if mock/API fails
        setPhase("form");
      }
    },
    [returnToGame],
  );

  const handleDevReset = useCallback(() => {
    if (spinning) return;
    stopSpinSound();
    resetPrizeStorage();
    setPrizes([...DEFAULT_PRIZES]);
    returnToGame();
  }, [returnToGame, spinning, stopSpinSound]);

  return (
    <div className="wheel-root">
      <audio ref={spinSoundRef} src="/sound/spine.wav" preload="auto" />
      <audio ref={winSoundRef} src="/sound/Win.mp3" preload="auto" />
      <audio ref={lossSoundRef} src="/sound/loss.wav" preload="auto" />

      <div
        className="wheel-scaler"
        style={{
          width: DESIGN_W * scale,
          height: DESIGN_H * scale,
        }}
      >
        <div
          className="wheel-canvas"
          style={{ transform: `scale(${scale})` }}
        >
          <AnimatePresence>
            {overlayOpen && (
              <motion.div
                key="flow-backdrop"
                className="wheel-modal-backdrop"
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {phase === "reward" && (
              <motion.section
                key="reward-popup"
                className="wheel-window"
                id="window"
                initial={{ opacity: 0, scale: 0.82, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.88,
                  y: 12,
                  transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
                }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 20,
                  mass: 0.72,
                }}
              >
                <div className="wheel-winchild">
                  <h1 dangerouslySetInnerHTML={{ __html: modalPrize }} />
                </div>
                <BrandButton
                  variant="default"
                  className="min-h-21 w-105 rounded-xl px-9 py-6! text-[42px]! font-semibold shadow-[0_10px_28px_rgba(0,0,0,0.4)] border-4 border-[#DA291C]"
                  onClick={handleOpenForm}
                >
                  New Game
                </BrandButton>
              </motion.section>
            )}

            {(phase === "form" || phase === "submitting") && (
              <motion.section
                key={`user-form-${formSession}`}
                className="flow-shell"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                <UserInfoForm
                  prizeHtml={modalPrize}
                  submitting={phase === "submitting"}
                  onSubmit={handleParticipantSubmit}
                />
              </motion.section>
            )}

            {phase === "success" && (
              <motion.section
                key="success"
                className="flow-shell"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
              >
                <SuccessCelebration />
              </motion.section>
            )}
          </AnimatePresence>

          <section className="wheel-main">
            <section className="wheel-home">
              <div className="wheel-arrow" />
              <motion.div
                className="wheel-disk"
                id="wheel"
                animate={controls}
                initial={{ rotate: 0 }}
              >
                <div className="wheel-mainwheel">
                  {(hydrated ? prizes : [...DEFAULT_PRIZES]).map((prize, i) => (
                    <div className="wheel-price" key={`${i}-${prize}`}>
                      <h1 dangerouslySetInnerHTML={{ __html: prize }} />
                    </div>
                  ))}
                </div>
              </motion.div>
              <div className="wheel-touch">
                <button
                  id="spin"
                  type="button"
                  disabled={spinning || phase !== "game"}
                  onClick={handleSpin}
                >
                  SPIN
                </button>
              </div>
            </section>
          </section>
        </div>
      </div>

      {process.env.NODE_ENV !== "production" && (
        <button
          type="button"
          className="wheel-dev-reset"
          onClick={handleDevReset}
          disabled={spinning}
        >
          Reset
        </button>
      )}
    </div>
  );
}
