import { randomUUID } from "crypto";
import { getSql } from "@/lib/db";
import { isAllowedPrizeLabel } from "@/lib/prize-labels";

export type GameSessionRow = {
  id: string;
  prize: string | null;
  prize_assigned_at: Date | null;
  created_at: Date;
};

export async function createGameSession(): Promise<GameSessionRow> {
  const sql = getSql();
  const id = randomUUID();
  const rows = await sql<GameSessionRow[]>`
    INSERT INTO game_sessions (id)
    VALUES (${id})
    RETURNING id, prize, prize_assigned_at, created_at
  `;
  return rows[0];
}

export async function getGameSession(
  id: string,
): Promise<GameSessionRow | null> {
  const sql = getSql();
  const rows = await sql<GameSessionRow[]>`
    SELECT id, prize, prize_assigned_at, created_at
    FROM game_sessions
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/**
 * Locks the prize onto a session exactly once.
 * Rejects unknown prizes and re-assignment attempts.
 */
export async function assignPrizeToSession(
  gameSessionId: string,
  prizeLabel: string,
): Promise<
  | { ok: true; session: GameSessionRow }
  | {
      ok: false;
      code: "not_found" | "invalid_prize" | "already_assigned" | "error";
      message: string;
    }
> {
  if (!isAllowedPrizeLabel(prizeLabel)) {
    return {
      ok: false,
      code: "invalid_prize",
      message: "Please provide valid information",
    };
  }

  const sql = getSql();

  try {
    const existing = await getGameSession(gameSessionId);
    if (!existing) {
      return {
        ok: false,
        code: "not_found",
        message: "Please provide valid information",
      };
    }
    if (existing.prize !== null) {
      return {
        ok: false,
        code: "already_assigned",
        message: "Please provide valid information",
      };
    }

    const rows = await sql<GameSessionRow[]>`
      UPDATE game_sessions
      SET
        prize = ${prizeLabel},
        prize_assigned_at = NOW()
      WHERE id = ${gameSessionId}
        AND prize IS NULL
      RETURNING id, prize, prize_assigned_at, created_at
    `;

    if (!rows[0]) {
      return {
        ok: false,
        code: "already_assigned",
        message: "Please provide valid information",
      };
    }

    return { ok: true, session: rows[0] };
  } catch (error) {
    console.error("[game-sessions] assignPrizeToSession failed", error);
    return {
      ok: false,
      code: "error",
      message: "Unable to save your information. Please try again.",
    };
  }
}

export type InsertParticipantInput = {
  name: string;
  contactNumber: string;
  prize: string;
  gameSessionId: string;
};

export type InsertParticipantResult =
  | { ok: true }
  | {
      ok: false;
      code: "duplicate" | "error";
      message: string;
    };

export async function insertParticipant(
  input: InsertParticipantInput,
): Promise<InsertParticipantResult> {
  const sql = getSql();

  try {
    await sql`
      INSERT INTO participants (name, contact_number, prize, game_session_id)
      VALUES (
        ${input.name},
        ${input.contactNumber},
        ${input.prize},
        ${input.gameSessionId}
      )
    `;
    return { ok: true };
  } catch (error: unknown) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string"
        ? (error as { code: string }).code
        : null;

    // unique_violation
    if (code === "23505") {
      return {
        ok: false,
        code: "duplicate",
        message: "This game has already been submitted",
      };
    }

    console.error("[participants] insertParticipant failed", error);
    return {
      ok: false,
      code: "error",
      message: "Unable to save your information. Please try again.",
    };
  }
}

export async function participantExistsForSession(
  gameSessionId: string,
): Promise<boolean> {
  const sql = getSql();
  const rows = await sql<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM participants WHERE game_session_id = ${gameSessionId}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}
