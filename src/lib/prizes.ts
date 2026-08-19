export const DEFAULT_PRIZES = [
  "Better Luck<br>Next Time",
  "Water<br>Bottle",
  "Leather MAG<br>Card Holder",
  "Better Luck<br>Next Time",
  "Phone Stand<br>UGREEN",
  "Laptop Stand<br>UGREEN",
  "Better Luck<br>Next Time",
  "Try<br>Again",
] as const;

export const BETTER_LUCK = "Better Luck<br>Next Time";
export const TRY_AGAIN = "Try<br>Again";

export function isWinPrize(prizeHtml: string): boolean {
  return prizeHtml !== BETTER_LUCK && prizeHtml !== TRY_AGAIN;
}

export function isTryAgainPrize(prizeHtml: string): boolean {
  return prizeHtml === TRY_AGAIN;
}

/** Max 2 each — for testing stock conversion */
export const PRIZE_LIMITS = {
  "Water<br>Bottle": { key: "WB", max: 2 },
  "Leather MAG<br>Card Holder": { key: "LMCH", max: 2 },
  "Phone Stand<br>UGREEN": { key: "PSU", max: 2 },
  "Laptop Stand<br>UGREEN": { key: "LSU", max: 2 },
} as const;

export type PrizeText = string;
export type PrizeLimitKey = (typeof PRIZE_LIMITS)[keyof typeof PRIZE_LIMITS]["key"];

export const SLICE_COUNT = 8;
export const SLICE_DEG = 360 / SLICE_COUNT;
export const SPIN_DURATION_MS = 2500;

/** Bump this whenever DEFAULT_PRIZES / PRIZE_LIMITS change so localStorage resets */
export const PRIZE_CONFIG_VERSION = "gifts-v3";

