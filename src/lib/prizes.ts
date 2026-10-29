export const BETTER_LUCK = "Better Luck<br>Next Time";
export const TRY_AGAIN = "Try<br>Again";

/** Canonical prize text (popup + database). */
export const MAGNETIC_PHONE_HOLDER =
  "Water Bottle with<br>Magnetic Phone Holder";
export const LEATHER_CARD_HOLDER = "Leather Magnetic<br>Card Holder";
export const PHONE_TABLET_STAND = "Phone & Tablet<br>Stand";

/** Compact 2-line labels so slice text stays inside the wedge. */
export const WHEEL_LABELS: Record<string, string> = {
  [MAGNETIC_PHONE_HOLDER]:
    "Water Bottle with<br>Magnetic Phone Holder",
  [LEATHER_CARD_HOLDER]: "Leather MAG<br>Card Holder",
  [PHONE_TABLET_STAND]: "Phone & Tablet<br>Stand",
};

export const DEFAULT_PRIZES = [
  "Better Luck<br>Next Time",
  MAGNETIC_PHONE_HOLDER,
  LEATHER_CARD_HOLDER,
  "Better Luck<br>Next Time",
  PHONE_TABLET_STAND,
  TRY_AGAIN,
  "Better Luck<br>Next Time",
  TRY_AGAIN,
] as const;

export function wheelLabelFor(prizeHtml: string): string {
  return WHEEL_LABELS[prizeHtml] ?? prizeHtml;
}

export function isWinPrize(prizeHtml: string): boolean {
  return prizeHtml !== BETTER_LUCK && prizeHtml !== TRY_AGAIN;
}

export function isTryAgainPrize(prizeHtml: string): boolean {
  return prizeHtml === TRY_AGAIN;
}

export const PRIZE_LIMITS = {
  [MAGNETIC_PHONE_HOLDER]: { key: "MPHB", max: 33 },
  [LEATHER_CARD_HOLDER]: { key: "LMCH", max: 34 },
  [PHONE_TABLET_STAND]: { key: "PTS", max: 34 },
} as const;

export type PrizeText = string;
export type PrizeLimitKey = (typeof PRIZE_LIMITS)[keyof typeof PRIZE_LIMITS]["key"];

export const SLICE_COUNT = 8;
export const SLICE_DEG = 360 / SLICE_COUNT;
export const SPIN_DURATION_MS = 2500;

/** Bump this whenever DEFAULT_PRIZES / PRIZE_LIMITS change so localStorage resets */
export const PRIZE_CONFIG_VERSION = "gifts-v8";
