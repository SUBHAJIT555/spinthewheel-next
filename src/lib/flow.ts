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

const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

export function validateParticipantForm(
  values: ParticipantFormValues,
): ParticipantFormErrors {
  const errors: ParticipantFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Name is required.";
  }

  const phone = values.contactNumber.trim();
  if (!phone) {
    errors.contactNumber = "Contact number is required.";
  } else if (!PHONE_RE.test(phone) || phone.replace(/\D/g, "").length < 7) {
    errors.contactNumber = "Enter a valid contact number.";
  }

  return errors;
}
