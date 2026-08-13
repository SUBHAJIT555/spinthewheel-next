import { normalizeUaeMobile } from "@/lib/phone";

export type FlowPhase = "game" | "reward" | "form" | "submitting" | "success";

export type ParticipantFormValues = {
  name: string;
  contactNumber: string;
};

export type ParticipantFormErrors = Partial<
  Record<keyof ParticipantFormValues, string>
>;

export const EMPTY_PARTICIPANT_FORM: ParticipantFormValues = {
  name: "",
  contactNumber: "",
};

const NAME_MAX = 80;

export function validateParticipantForm(
  values: ParticipantFormValues,
): ParticipantFormErrors {
  const errors: ParticipantFormErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > NAME_MAX) {
    errors.name = "Name is too long.";
  }

  const phone = values.contactNumber.trim();
  if (!phone) {
    errors.contactNumber = "Contact number is required.";
  } else {
    const normalized = normalizeUaeMobile(phone);
    if (!normalized.ok) {
      errors.contactNumber = "Enter a valid UAE mobile number.";
    }
  }

  return errors;
}
