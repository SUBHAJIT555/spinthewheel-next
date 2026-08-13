import { NextResponse } from "next/server";
import {
  getGameSession,
  insertParticipant,
  participantExistsForSession,
} from "@/lib/game-sessions";
import {
  normalizeUaeMobile,
  validateParticipantName,
} from "@/lib/phone";

export const runtime = "nodejs";

type ApiBody = {
  success: boolean;
  message: string;
};

function json(body: ApiBody, status: number) {
  return NextResponse.json(body, { status });
}

/**
 * POST /api/participants
 * Saves name + contact. Prize is read from the verified game session — never from the client.
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

  const { name, contactNumber, gameSessionId } = body as Record<
    string,
    unknown
  >;

  const nameResult = validateParticipantName(name);
  if (!nameResult.ok) {
    return json({ success: false, message: nameResult.message }, 400);
  }

  if (typeof contactNumber !== "string") {
    return json(
      { success: false, message: "Please provide valid information" },
      400,
    );
  }

  const phoneResult = normalizeUaeMobile(contactNumber);
  if (!phoneResult.ok) {
    return json(
      { success: false, message: "Please provide valid information" },
      400,
    );
  }

  if (typeof gameSessionId !== "string" || !gameSessionId.trim()) {
    return json(
      { success: false, message: "Please provide valid information" },
      400,
    );
  }

  const sessionId = gameSessionId.trim();

  try {
    const session = await getGameSession(sessionId);
    if (!session) {
      return json(
        { success: false, message: "Please provide valid information" },
        400,
      );
    }

    if (!session.prize) {
      return json(
        { success: false, message: "Please provide valid information" },
        400,
      );
    }

    if (await participantExistsForSession(sessionId)) {
      return json(
        {
          success: false,
          message: "This game has already been submitted",
        },
        409,
      );
    }

    const insert = await insertParticipant({
      name: nameResult.name,
      contactNumber: phoneResult.e164,
      prize: session.prize,
      gameSessionId: sessionId,
    });

    if (!insert.ok) {
      const status = insert.code === "duplicate" ? 409 : 500;
      return json({ success: false, message: insert.message }, status);
    }

    return json(
      {
        success: true,
        message: "Participant registered successfully",
      },
      201,
    );
  } catch (error) {
    console.error("[api/participants] POST failed", error);
    return json(
      {
        success: false,
        message: "Unable to save your information. Please try again.",
      },
      500,
    );
  }
}
