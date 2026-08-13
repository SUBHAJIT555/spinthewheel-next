const NAME_MAX_LENGTH = 80;

/** UAE mobile: +971 5X XXX XXXX (9 digits after country code, starting with 5) */
const UAE_MOBILE_E164 = /^\+9715\d{8}$/;

export type NormalizePhoneResult =
  | { ok: true; e164: string }
  | { ok: false; message: string };

export function normalizeUaeMobile(raw: string): NormalizePhoneResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: "Contact number is required." };
  }

  // Keep leading +; strip other non-digits
  let digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.includes("+") && !digits.startsWith("+")) {
    return { ok: false, message: "Enter a valid UAE mobile number." };
  }
  digits = digits.startsWith("+")
    ? `+${digits.slice(1).replace(/\D/g, "")}`
    : digits.replace(/\D/g, "");

  let e164: string;

  if (digits.startsWith("+971")) {
    e164 = digits;
  } else if (digits.startsWith("00971")) {
    e164 = `+${digits.slice(2)}`;
  } else if (digits.startsWith("971") && digits.length === 12) {
    e164 = `+${digits}`;
  } else if (digits.startsWith("05") && digits.length === 10) {
    // 0501234567 → +971501234567
    e164 = `+971${digits.slice(1)}`;
  } else if (digits.startsWith("5") && digits.length === 9) {
    // 501234567 → +971501234567
    e164 = `+971${digits}`;
  } else {
    return { ok: false, message: "Enter a valid UAE mobile number." };
  }

  if (!UAE_MOBILE_E164.test(e164)) {
    return { ok: false, message: "Enter a valid UAE mobile number." };
  }

  return { ok: true, e164 };
}

export function validateParticipantName(
  raw: unknown,
): { ok: true; name: string } | { ok: false; message: string } {
  if (typeof raw !== "string") {
    return { ok: false, message: "Please provide valid information" };
  }
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) {
    return { ok: false, message: "Please provide valid information" };
  }
  if (name.length > NAME_MAX_LENGTH) {
    return { ok: false, message: "Please provide valid information" };
  }
  return { ok: true, name };
}

export { NAME_MAX_LENGTH, UAE_MOBILE_E164 };
