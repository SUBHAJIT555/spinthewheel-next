export type ParticipantPayload = {
  name: string;
  contactNumber: string;
  prize?: string;
};

export type SubmitParticipantResult = {
  ok: true;
  id: string;
};

/**
 * Mock participant submission — replace with POST /api/participants later.
 */
export async function submitParticipant(
  data: ParticipantPayload,
): Promise<SubmitParticipantResult> {
  // Simulate network latency for UX testing
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Temporary: no backend yet
  console.info("[mock] submitParticipant", data);

  return {
    ok: true,
    id: `mock-${Date.now()}`,
  };
}
