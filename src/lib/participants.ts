export type ParticipantPayload = {
  name: string;
  contactNumber: string;
  gameSessionId: string;
};

export type SubmitParticipantResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export type CreateGameSessionResult =
  | { ok: true; gameSessionId: string }
  | { ok: false; message: string };

export type ClaimPrizeResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

type ApiJson = {
  success?: boolean;
  message?: string;
  gameSessionId?: string;
};

async function readJson(res: Response): Promise<ApiJson> {
  try {
    return (await res.json()) as ApiJson;
  } catch {
    return {};
  }
}

export async function createGameSession(): Promise<CreateGameSessionResult> {
  try {
    const res = await fetch("/api/game-sessions", {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    const data = await readJson(res);
    if (!res.ok || !data.success || !data.gameSessionId) {
      return {
        ok: false,
        message:
          data.message ?? "Unable to save your information. Please try again.",
      };
    }
    return { ok: true, gameSessionId: data.gameSessionId };
  } catch {
    return {
      ok: false,
      message: "Unable to save your information. Please try again.",
    };
  }
}

export async function claimGameSessionPrize(
  gameSessionId: string,
  prizeHtml: string,
): Promise<ClaimPrizeResult> {
  try {
    const res = await fetch("/api/game-sessions/claim", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameSessionId, prize: prizeHtml }),
    });
    const data = await readJson(res);
    if (!res.ok || !data.success) {
      return {
        ok: false,
        message:
          data.message ?? "Unable to save your information. Please try again.",
      };
    }
    return {
      ok: true,
      message: data.message ?? "Prize assigned to game session",
    };
  } catch {
    return {
      ok: false,
      message: "Unable to save your information. Please try again.",
    };
  }
}

/**
 * Registers the participant. Prize is resolved server-side from gameSessionId.
 */
export async function submitParticipant(
  data: ParticipantPayload,
): Promise<SubmitParticipantResult> {
  try {
    const res = await fetch("/api/participants", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        contactNumber: data.contactNumber,
        gameSessionId: data.gameSessionId,
      }),
    });
    const payload = await readJson(res);
    if (!res.ok || !payload.success) {
      return {
        ok: false,
        message:
          payload.message ??
          "Unable to save your information. Please try again.",
      };
    }
    return {
      ok: true,
      message: payload.message ?? "Participant registered successfully",
    };
  } catch {
    return {
      ok: false,
      message: "Unable to save your information. Please try again.",
    };
  }
}
