import { NextResponse } from "next/server";
import { createGameSession } from "@/lib/game-sessions";

export const runtime = "nodejs";

type ApiBody = {
  success: boolean;
  message: string;
  gameSessionId?: string;
};

function json(body: ApiBody, status: number) {
  return NextResponse.json(body, { status });
}

/**
 * POST /api/game-sessions
 * Creates a new game attempt. Call when the user starts a spin.
 */
export async function POST() {
  try {
    const session = await createGameSession();
    return json(
      {
        success: true,
        message: "Game session created",
        gameSessionId: session.id,
      },
      201,
    );
  } catch (error) {
    console.error("[api/game-sessions] POST failed", error);
    return json(
      {
        success: false,
        message: "Unable to save your information. Please try again.",
      },
      500,
    );
  }
}
