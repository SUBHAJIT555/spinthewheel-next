export const BETTER_LUCK = "Better Luck<br>Next Time";
export const TRY_AGAIN = "Try<br>Again";

export const DEFAULT_PRIZES = [
  "Better Luck<br>Next Time",
  "Water<br>Bottle",
  "Leather MAG<br>Card Holder",
  "Better Luck<br>Next Time",
  "Phone Stand<br>UGREEN",
  "Laptop Stand<br>UGREEN",
  "Better Luck<br>Next Time",
  TRY_AGAIN,
] as const;

export function isWinPrize(prizeHtml: string): boolean {
  return prizeHtml !== BETTER_LUCK && prizeHtml !== TRY_AGAIN;
}

export function isTryAgainPrize(prizeHtml: string): boolean {
  return prizeHtml === TRY_AGAIN;
}

/** Max 2 each — for testing stock conversion */
export const PRIZE_LIMITS = {
  "Water<br>Bottle": { key: "WB", max: 200 },
  "Leather MAG<br>Card Holder": { key: "LMCH", max: 200 },
  "Phone Stand<br>UGREEN": { key: "PSU", max: 200 },
  "Laptop Stand<br>UGREEN": { key: "LSU", max: 200 },
} as const;

export type PrizeText = string;
export type PrizeLimitKey = (typeof PRIZE_LIMITS)[keyof typeof PRIZE_LIMITS]["key"];

export const SLICE_COUNT = 8;
export const SLICE_DEG = 360 / SLICE_COUNT;
export const SPIN_DURATION_MS = 2500;

/** Bump this whenever DEFAULT_PRIZES / PRIZE_LIMITS change so localStorage resets */
export const PRIZE_CONFIG_VERSION = "gifts-v4";
