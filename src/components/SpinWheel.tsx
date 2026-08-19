"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, AnimatePresence } from "motion/react";
import BrandButton from "@/components/BrandButton";
import UserInfoForm from "@/components/UserInfoForm";
import SuccessCelebration from "@/components/SuccessCelebration";
import {
  BETTER_LUCK,
  DEFAULT_PRIZES,
  isTryAgainPrize,
  isWinPrize,
  PRIZE_CONFIG_VERSION,
  PRIZE_LIMITS,
  SLICE_DEG,
  SPIN_DURATION_MS,
} from "@/lib/prizes";
import type { FlowPhase } from "@/lib/flow";
import {
  claimGameSessionPrize,
  createGameSession,
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
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalRotation = useRef(0);
  const controls = useAnimationControls();
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionPromiseRef = useRef<ReturnType<typeof createGameSession> | null>(
    null,
  );
  const claimPromiseRef = useRef<Promise<void> | null>(null);
  const pendingPrizeRef = useRef<string | null>(null);

  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const lossSoundRef = useRef<HTMLAudioElement | null>(null);
  const tryAgainSoundRef = useRef<HTMLAudioElement | null>(null);
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

  const playResultSound = useCallback(
    (kind: "win" | "loss" | "retry") => {
      const sound =
        kind === "win"
          ? winSoundRef.current
          : kind === "retry"
            ? tryAgainSoundRef.current
            : lossSoundRef.current;
      if (!sound) return;
      sound.currentTime = 0;
      void sound.play();
    },
    [],
  );

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
    sessionPromiseRef.current = null;
    claimPromiseRef.current = null;
    pendingPrizeRef.current = null;
    setPhase("game");
    setModalPrize("CX Day<br />Surprise");
    setGameSessionId(null);
    setSubmitError(null);
    setFormSession((n) => n + 1);
    totalRotation.current = 0;
    void controls.set({ rotate: 0 });
  }, [controls]);

  /** Wait for session + prize lock without blocking the spin UI. */
  const ensureSessionReady = useCallback(async (prizeHtml: string) => {
    if (claimPromiseRef.current) {
      await claimPromiseRef.current;
    }

    let sessionId = gameSessionId;

    if (!sessionId && sessionPromiseRef.current) {
      const created = await sessionPromiseRef.current;
      if (created.ok) {
        sessionId = created.gameSessionId;
        setGameSessionId(created.gameSessionId);
      } else {
        return { ok: false as const, message: created.message };
      }
    }

    if (!sessionId) {
      return {
        ok: false as const,
        message: "Unable to save your information. Please try again.",
      };
    }

    const claim = await claimGameSessionPrize(sessionId, prizeHtml);
    if (!claim.ok) {
      // Already locked from background claim is fine; submit will verify.
      console.warn("[session] claim:", claim.message);
    }

    return { ok: true as const, gameSessionId: sessionId };
  }, [gameSessionId]);

  const handleSpin = useCallback(async () => {
    if (spinning || phase !== "game") return;
    setSpinning(true);
    setSubmitError(null);
    setGameSessionId(null);
    pendingPrizeRef.current = null;
    claimPromiseRef.current = null;

    // Start session in parallel — do not block the wheel
    sessionPromiseRef.current = createGameSession().then((result) => {
      if (result.ok) {
        setGameSessionId(result.gameSessionId);
      } else {
        setSubmitError(result.message);
      }
      return result;
    });

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
    pendingPrizeRef.current = selectedPrize;

    stopSpinSound();
    playResultSound(
      isTryAgainPrize(selectedPrize)
        ? "retry"
        : isWinPrize(selectedPrize)
          ? "win"
          : "loss",
    );

    // Show result immediately — claim runs in the background
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

    claimPromiseRef.current = (async () => {
      const session = await sessionPromiseRef.current;
      if (!session?.ok) return;
      const claim = await claimGameSessionPrize(
        session.gameSessionId,
        selectedPrize,
      );
      if (!claim.ok) {
        console.warn("[spin] background claim:", claim.message);
      }
    })();
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
    setSubmitError(null);
    setPhase("form");
    // Finish claim in background while user starts typing
    const prize = pendingPrizeRef.current ?? modalPrize;
    void ensureSessionReady(prize);
  }, [ensureSessionReady, modalPrize]);

  const handleTryAgain = useCallback(() => {
    sessionPromiseRef.current = null;
    claimPromiseRef.current = null;
    pendingPrizeRef.current = null;
    setGameSessionId(null);
    setSubmitError(null);
    setPhase("game");
  }, []);

  const handleParticipantSubmit = useCallback(
    async (data: ParticipantPayload) => {
      setSubmitError(null);
      setPhase("submitting");

      const prize = pendingPrizeRef.current ?? modalPrize;
      const ready = await ensureSessionReady(prize);
      if (!ready.ok) {
        setSubmitError(ready.message);
        setPhase("form");
        return;
      }

      const result = await submitParticipant({
        ...data,
        gameSessionId: ready.gameSessionId,
      });

      if (!result.ok) {
        setSubmitError(result.message);
        setPhase("form");
        return;
      }

      setPhase("success");
      successTimerRef.current = setTimeout(() => {
        returnToGame();
      }, SUCCESS_HOLD_MS);
    },
    [ensureSessionReady, modalPrize, returnToGame],
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
      <audio
        ref={tryAgainSoundRef}
        src="/sound/try-again.wav"
        preload="auto"
      />

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
                key={
                  isTryAgainPrize(modalPrize)
                    ? "try-again-popup"
                    : "reward-popup"
                }
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
                {isTryAgainPrize(modalPrize) ? (
                  <>
                    <motion.div
                      className="wheel-winchild wheel-winchild--retry"
                      initial={{ scale: 0.86, rotate: -4 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 16,
                      }}
                    >
                      <div className="wheel-retry-glow" aria-hidden />
                      <div className="wheel-retry-copy">
                        <span className="wheel-retry-label">Bonus spin</span>
                        <h1>One more chance!</h1>
                        <p className="wheel-retry-message">
                          The wheel is still yours — spin again and
                          take another shot.
                        </p>
                      </div>
                    </motion.div>
                    <BrandButton
                      variant="default"
                      className="min-h-21 w-105 rounded-xl px-9 py-6! text-[42px]! font-semibold shadow-[0_10px_28px_rgba(0,0,0,0.4)] border-4 border-[#DA291C]"
                      onClick={handleTryAgain}
                    >
                      Try Again
                    </BrandButton>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                  gameSessionId={gameSessionId}
                  submitting={phase === "submitting"}
                  submitError={submitError}
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

      {phase === "game" && submitError && (
        <p className="wheel-session-error" role="alert">
          {submitError}
        </p>
      )}
    </div>
  );
}
