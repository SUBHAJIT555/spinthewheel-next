export type FlowPhase = "game" | "reward" | "form" | "submitting" | "success";

export type ParticipantFormValues = {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
};

export type ParticipantFormErrors = Partial<
  Record<keyof ParticipantFormValues, string>
>;

export const EMPTY_PARTICIPANT_FORM: ParticipantFormValues = {
  firstName: "",
  lastName: "",
  contactNumber: "",
  email: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

export function validateParticipantForm(
  values: ParticipantFormValues,
): ParticipantFormErrors {
  const errors: ParticipantFormErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  const phone = values.contactNumber.trim();
  if (!phone) {
    errors.contactNumber = "Contact number is required.";
  } else if (!PHONE_RE.test(phone) || phone.replace(/\D/g, "").length < 7) {
    errors.contactNumber = "Enter a valid contact number.";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}
