"use client";

import {
  FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "motion/react";
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

export type ParticipantDraft = {
  name: string;
  contactNumber: string;
};

type UserInfoFormProps = {
  submitting?: boolean;
  submitError?: string | null;
  onContinue: (data: ParticipantDraft) => void | Promise<void>;
};

type FieldConfig = {
  key: keyof ParticipantFormValues;
  label: string;
  placeholder: string;
  mode: KeyboardMode;
};

const FIELD_ORDER: FieldConfig[] = [
  {
    key: "name",
    label: "Name",
    placeholder: "Enter your name",
    mode: "text",
  },
  {
    key: "contactNumber",
    label: "Contact",
    placeholder: "Enter your contact number",
    mode: "tel",
  },
];

export default function UserInfoForm({
  submitting = false,
  submitError = null,
  onContinue,
}: UserInfoFormProps) {
  const formId = useId();

  const [values, setValues] = useState<ParticipantFormValues>(
    EMPTY_PARTICIPANT_FORM,
  );
  const [errors, setErrors] = useState<ParticipantFormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof ParticipantFormValues, boolean>>
  >({});
  const [activeField, setActiveField] =
    useState<keyof ParticipantFormValues>("name");

  const [keyboardShake, setKeyboardShake] = useState(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConfig = useMemo(
    () => FIELD_ORDER.find((f) => f.key === activeField) ?? FIELD_ORDER[0],
    [activeField],
  );

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
    if (submitting) return;

    let nextChunk = chunk;
    if (activeField === "name" && /^[a-zA-Z]$/.test(chunk)) {
      const current = values.name;
      if (current.length === 0 || /\s$/.test(current)) {
        nextChunk = chunk.toUpperCase();
      }
    }

    updateField(activeField, `${values[activeField]}${nextChunk}`);
  }

  function backspaceActive() {
    if (submitting) return;
    updateField(activeField, values[activeField].slice(0, -1));
  }

  function clearActive() {
    if (submitting) return;
    updateField(activeField, "");
  }

  function goNextField() {
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
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const nextErrors = validateParticipantForm(values);
    setErrors(nextErrors);
    setTouched({
      name: true,
      contactNumber: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      const firstInvalid = FIELD_ORDER.find((f) => nextErrors[f.key]);
      if (firstInvalid) setActiveField(firstInvalid.key);
      triggerShake();
      return;
    }

    await onContinue({
      name: values.name.trim(),
      contactNumber: values.contactNumber.trim(),
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
    <div className="flow-form-layout flow-form-layout--single">
      <motion.div
        className="flow-panel flow-panel--single"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{
          opacity: 0,
          scale: 0.96,
          y: 14,
          transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
        }}
        transition={{ type: "spring", stiffness: 380, damping: 24, mass: 0.75 }}
      >
        <header className="flow-panel-header flow-panel-header--center">
          <h2 className="flow-panel-title">Your Details</h2>
          <p className="flow-panel-subtitle">
            Enter your name and contact number to spin
          </p>
        </header>

        <form
          id={formId}
          className="flow-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flow-field-row">{FIELD_ORDER.map(renderField)}</div>

          {submitError && (
            <p className="flow-submit-error" role="alert">
              {submitError}
            </p>
          )}

          <OnScreenKeyboard
            mode={activeConfig.mode}
            fieldKey={activeField}
            fieldLabel={activeConfig.label}
            value={values[activeField]}
            shake={keyboardShake}
            showPreview={false}
            disabled={submitting}
            onKey={appendToActive}
            onBackspace={backspaceActive}
            onClear={clearActive}
            onSpace={() => appendToActive(" ")}
            onNext={goNextField}
          />

          <div className="flow-submit-wrap">
            <BrandButton
              type="submit"
              variant="default"
              disabled={submitting}
              className="flow-submit"
            >
              {submitting ? "Please wait..." : "Continue"}
            </BrandButton>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
