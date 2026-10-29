export const BETTER_LUCK = "Better Luck<br>Next Time";
export const TRY_AGAIN = "Try<br>Again";

export const MAGNETIC_PHONE_HOLDER = "Magnetic<br>Phone Holder";
export const LEATHER_CARD_HOLDER = "Leather MAG<br>Card Holder";
export const GREEN_LION_HOLDER = "Green Lion<br>M4 Holder";

export const DEFAULT_PRIZES = [
  "Better Luck<br>Next Time",
  MAGNETIC_PHONE_HOLDER,
  LEATHER_CARD_HOLDER,
  "Better Luck<br>Next Time",
  GREEN_LION_HOLDER,
  TRY_AGAIN,
  "Better Luck<br>Next Time",
  TRY_AGAIN,
] as const;

export function isWinPrize(prizeHtml: string): boolean {
  return prizeHtml !== BETTER_LUCK && prizeHtml !== TRY_AGAIN;
}

export function isTryAgainPrize(prizeHtml: string): boolean {
  return prizeHtml === TRY_AGAIN;
}

export const PRIZE_LIMITS = {
  [MAGNETIC_PHONE_HOLDER]: { key: "MPHB", max: 1 },
  [LEATHER_CARD_HOLDER]: { key: "LMCH", max: 1 },
  [GREEN_LION_HOLDER]: { key: "GLM4", max: 1 },
} as const;

export type PrizeText = string;
export type PrizeLimitKey = (typeof PRIZE_LIMITS)[keyof typeof PRIZE_LIMITS]["key"];

export const SLICE_COUNT = 8;
export const SLICE_DEG = 360 / SLICE_COUNT;
export const SPIN_DURATION_MS = 2500;

/** Bump this whenever DEFAULT_PRIZES / PRIZE_LIMITS change so localStorage resets */
export const PRIZE_CONFIG_VERSION = "gifts-v7";
