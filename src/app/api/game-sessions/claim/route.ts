import { NextResponse } from "next/server";
import { assignPrizeToSession } from "@/lib/game-sessions";
import { normalizePrizeLabel } from "@/lib/prize-labels";

export const runtime = "nodejs";

type ApiBody = {
  success: boolean;
  message: string;
};

function json(body: ApiBody, status: number) {
  return NextResponse.json(body, { status });
}

/**
 * POST /api/game-sessions/claim
 * Locks the landed prize onto an existing session (once).
 * Prize must be in the allowed wheel set; cannot be changed later.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      { success: false, message: "Please provide valid information" },
      400,
    );
  }

  if (!body || typeof body !== "object") {
    return json(
      { success: false, message: "Please provide valid information" },
      400,
    );
  }

  const { gameSessionId, prize } = body as Record<string, unknown>;

  if (typeof gameSessionId !== "string" || !gameSessionId.trim()) {
    return json(
      { success: false, message: "Please provide valid information" },
      400,
    );
  }

  if (typeof prize !== "string" || !prize.trim()) {
    return json(
      { success: false, message: "Please provide valid information" },
      400,
    );
  }

  const prizeLabel = normalizePrizeLabel(prize);
  const result = await assignPrizeToSession(gameSessionId.trim(), prizeLabel);

  if (!result.ok) {
    const status =
      result.code === "not_found" || result.code === "invalid_prize"
        ? 400
        : result.code === "already_assigned"
          ? 409
          : 500;
    return json({ success: false, message: result.message }, status);
  }

  return json(
    { success: true, message: "Prize assigned to game session" },
    200,
  );
}
