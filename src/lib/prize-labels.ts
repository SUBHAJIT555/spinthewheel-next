import { BETTER_LUCK, DEFAULT_PRIZES } from "@/lib/prizes";

/** Human-readable prize label stored in the database (no HTML). */
export function normalizePrizeLabel(prizeHtml: string): string {
  return prizeHtml
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Allowed prizes the client may assign to a session (includes Better Luck). */
export const ALLOWED_PRIZE_LABELS: readonly string[] = Array.from(
  new Set(DEFAULT_PRIZES.map((p) => normalizePrizeLabel(p))),
);

export const BETTER_LUCK_LABEL = normalizePrizeLabel(BETTER_LUCK);

export function isAllowedPrizeLabel(label: string): boolean {
  return ALLOWED_PRIZE_LABELS.includes(label);
}
