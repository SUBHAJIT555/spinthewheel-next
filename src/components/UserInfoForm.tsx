"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import BrandButton from "@/components/BrandButton";
import OnScreenKeyboard, {
  type KeyboardMode,
} from "@/components/OnScreenKeyboard";
import {
  EMPTY_PARTICIPANT_FORM,
  type ParticipantFormErrors,
  type ParticipantFormValues,
  validateParticipantForm,
} from "@/lib/flow";
import type { ParticipantPayload } from "@/lib/participants";
import { BETTER_LUCK } from "@/lib/prizes";

type UserInfoFormProps = {
  prizeHtml: string;
  submitting: boolean;
  onSubmit: (data: ParticipantPayload) => void | Promise<void>;
};

type FieldConfig = {
  key: keyof ParticipantFormValues;
  label: string;
  placeholder: string;
  mode: KeyboardMode;
};

const FIELD_ORDER: FieldConfig[] = [
  {
    key: "firstName",
    label: "First Name",
    placeholder: "Enter your first name",
    mode: "text",
  },
  {
    key: "lastName",
    label: "Last Name",
    placeholder: "Enter your last name",
    mode: "text",
  },
  {
    key: "contactNumber",
    label: "Contact Number",
    placeholder: "Enter your contact number",
    mode: "tel",
  },
  {
    key: "email",
    label: "Email ID",
    placeholder: "Enter your email address",
    mode: "email",
  },
];

export default function UserInfoForm({
  prizeHtml,
  submitting,
  onSubmit,
}: UserInfoFormProps) {
  const formId = useId();
  const isWin = prizeHtml !== BETTER_LUCK;
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [values, setValues] = useState<ParticipantFormValues>(
    EMPTY_PARTICIPANT_FORM,
  );
  const [errors, setErrors] = useState<ParticipantFormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ParticipantFormValues, boolean>>
  >({});
  const [activeField, setActiveField] = useState<
    keyof ParticipantFormValues | null
  >("firstName");

  const [keyboardShake, setKeyboardShake] = useState(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConfig = useMemo(
    () => FIELD_ORDER.find((f) => f.key === activeField) ?? FIELD_ORDER[0],
    [activeField],
  );

  useEffect(() => {
    if (!activeField || !panelRef.current) return;
    const el = panelRef.current.querySelector<HTMLElement>(
      `[data-field="${activeField}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeField]);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  function triggerShake() {
    setKeyboardShake(true);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setKeyboardShake(false), 450);
  }

  function updateField<K extends keyof ParticipantFormValues>(
    key: K,
    value: ParticipantFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (touched[key] || errors[key]) {
      const next = { ...values, [key]: value };
      const nextErrors = validateParticipantForm(next);
      setErrors((prev) => ({ ...prev, [key]: nextErrors[key] }));
    }
  }

  function appendToActive(chunk: string) {
    if (!activeField || submitting) return;
    updateField(activeField, `${values[activeField]}${chunk}`);
  }

  function backspaceActive() {
    if (!activeField || submitting) return;
    updateField(activeField, values[activeField].slice(0, -1));
  }

  function clearActive() {
    if (!activeField || submitting) return;
    updateField(activeField, "");
  }

  function goNextField() {
    if (!activeField) {
      setActiveField("firstName");
      return;
    }

    setTouched((prev) => ({ ...prev, [activeField]: true }));
    const nextErrors = validateParticipantForm(values);
    const fieldError = nextErrors[activeField];
    setErrors((prev) => ({ ...prev, [activeField]: fieldError }));

    if (fieldError || !values[activeField].trim()) {
      triggerShake();
      return;
    }

    const index = FIELD_ORDER.findIndex((f) => f.key === activeField);
    const next = FIELD_ORDER[index + 1];
    if (next) {
      setActiveField(next.key);
    } else {
      // Last field filled — return to form for Submit
      setActiveField(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const nextErrors = validateParticipantForm(values);
    setErrors(nextErrors);
    setTouched({
      firstName: true,
      lastName: true,
      contactNumber: true,
      email: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = FIELD_ORDER.find((f) => nextErrors[f.key]);
      if (firstInvalid) setActiveField(firstInvalid.key);
      return;
    }

    setActiveField(null);
    await onSubmit({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      contactNumber: values.contactNumber.trim(),
      email: values.email.trim(),
      prize: prizeHtml.replace(/<br\s*\/?>/gi, " "),
    });
  }

  function renderField(field: FieldConfig) {
    const inputId = `${formId}-${field.key}`;
    const error = errors[field.key];
    const showError = Boolean(touched[field.key] && error);
    const isActive = activeField === field.key;

    return (
      <div
        className={`flow-field${isActive ? " is-active" : ""}`}
        key={field.key}
        data-field={field.key}
      >
        <label className="flow-label" htmlFor={inputId}>
          {field.label}
        </label>
        <button
          id={inputId}
          type="button"
          className={`flow-input flow-input-touch${showError ? " is-invalid" : ""}${isActive ? " is-focused" : ""}`}
          disabled={submitting}
          aria-invalid={showError}
          aria-describedby={showError ? `${inputId}-error` : undefined}
          onClick={() => setActiveField(field.key)}
        >
          {values[field.key] ? (
            <span className="flow-input-value">{values[field.key]}</span>
          ) : (
            <span className="flow-input-placeholder">{field.placeholder}</span>
          )}
        </button>
        {showError && (
          <p id={`${inputId}-error`} className="flow-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flow-form-layout${activeField ? " is-typing" : ""}`}>
      <motion.div
        ref={panelRef}
        className="flow-panel"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{
          opacity: 0,
          scale: 0.94,
          y: 16,
          transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
        }}
        transition={{ type: "spring", stiffness: 380, damping: 22, mass: 0.75 }}
      >
        <div className={`flow-result-banner${isWin ? " is-win" : " is-loss"}`}>
          <span className="flow-result-label">
            {isWin ? "Your Reward" : "Spin Result"}
          </span>
          <p
            className="flow-result-value"
            dangerouslySetInnerHTML={{ __html: prizeHtml }}
          />
        </div>

        <header className="flow-panel-header">
          <h2 className="flow-panel-title">Your Details</h2>
          <p className="flow-panel-subtitle">
            Tap a field — the keyboard opens in the center for easy standing use
          </p>
        </header>

        <form
          id={formId}
          className="flow-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flow-field-row">
            {FIELD_ORDER.slice(0, 2).map(renderField)}
          </div>
          {FIELD_ORDER.slice(2).map(renderField)}

          <div className="flow-submit-wrap">
            <BrandButton
              type="submit"
              variant="default"
              disabled={submitting}
              className="flow-submit"
            >
              {submitting ? "Submitting..." : "Submit"}
            </BrandButton>
          </div>
        </form>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeField && !submitting && (
          <OnScreenKeyboard
            mode={activeConfig.mode}
            fieldKey={activeField}
            fieldLabel={activeConfig.label}
            value={values[activeField]}
            shake={keyboardShake}
            disabled={submitting}
            onKey={appendToActive}
            onBackspace={backspaceActive}
            onClear={clearActive}
            onSpace={() => appendToActive(" ")}
            onNext={goNextField}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
