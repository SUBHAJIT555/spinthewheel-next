"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

export type KeyboardMode = "text" | "email" | "tel";

type OnScreenKeyboardProps = {
  mode: KeyboardMode;
  fieldLabel: string;
  value: string;
  shake?: boolean;
  disabled?: boolean;
  onKey: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSpace: () => void;
  onNext: () => void;
};

const ALPHA_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const NUMBER_ROW = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const SYMBOL_ROWS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["@", "#", "$", "_", "&", "-", "+", "(", ")", "/"],
  ["*", '"', "'", ":", ";", "!", "?", ".", ","],
];

const EMAIL_EXTRAS = ["@", ".", "-", "_"];
const TEL_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["+", "0", "#"],
];

export default function OnScreenKeyboard({
  mode,
  fieldLabel,
  value,
  shake = false,
  disabled = false,
  onKey,
  onBackspace,
  onClear,
  onSpace,
  onNext,
}: OnScreenKeyboardProps) {
  const [shift, setShift] = useState(mode === "text");
  const [symbols, setSymbols] = useState(false);

  useEffect(() => {
    setShift(mode === "text");
    setSymbols(false);
  }, [mode, fieldLabel]);

  const hint = useMemo(() => {
    if (mode === "tel") return "Number pad";
    if (symbols) return "Numbers & symbols";
    if (mode === "email") return "Letters · tap 123 for numbers";
    return shift ? "Uppercase" : "Lowercase";
  }, [mode, shift, symbols]);

  function pressChar(char: string) {
    if (disabled) return;
    const valueOut =
      !symbols && (mode === "text" || mode === "email")
        ? shift
          ? char
          : char.toLowerCase()
        : char;
    onKey(valueOut);
    if (mode === "text" && shift && !symbols) {
      setShift(false);
    }
  }

  return (
    <motion.div
      className="osk-stage"
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={
        shake
          ? { opacity: 1, scale: 1, y: 0, x: [0, -14, 14, -10, 10, -6, 6, 0] }
          : { opacity: 1, scale: 1, y: 0, x: 0 }
      }
      exit={{ opacity: 0, scale: 0.96, y: 16, transition: { duration: 0.2 } }}
      transition={
        shake
          ? { duration: 0.45, ease: "easeInOut" }
          : { type: "spring", stiffness: 360, damping: 24 }
      }
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className={`osk-preview${shake ? " is-shake" : ""}`}>
        <span className="osk-preview-label">{fieldLabel}</span>
        <p className="osk-preview-value">
          {value || <span className="osk-preview-empty">Start typing…</span>}
          <span className="osk-caret" aria-hidden />
        </p>
      </div>

      <div className="osk">
        <div className="osk-top">
          <div className="osk-meta">
            <span className="osk-field">{fieldLabel}</span>
            <span className="osk-hint">{hint}</span>
          </div>
          <div className="osk-top-actions">
            <button
              type="button"
              className="osk-action"
              disabled={disabled}
              onClick={onClear}
            >
              Clear
            </button>
            <button
              type="button"
              className={`osk-action osk-action-next${shake ? " is-shake" : ""}`}
              disabled={disabled}
              onClick={onNext}
            >
              Next
            </button>
          </div>
        </div>

        {mode === "tel" ? (
          <div className="osk-tel">
            {TEL_KEYS.map((row) => (
              <div className="osk-row" key={row.join("-")}>
                {row.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="osk-key osk-key-tel"
                    disabled={disabled}
                    onClick={() => pressChar(key)}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
            <div className="osk-row">
              <button
                type="button"
                className="osk-key osk-key-wide"
                disabled={disabled}
                onClick={onBackspace}
              >
                ⌫
              </button>
            </div>
          </div>
        ) : (
          <div className="osk-alpha">
            {!symbols && (mode === "email" || mode === "text") && (
              <div className="osk-row">
                {NUMBER_ROW.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="osk-key osk-key-num"
                    disabled={disabled}
                    onClick={() => onKey(key)}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}

            {(symbols ? SYMBOL_ROWS : ALPHA_ROWS).map((row, rowIndex) => (
              <div className="osk-row" key={`${symbols}-${row.join("")}`}>
                {rowIndex === 2 && !symbols && (
                  <button
                    type="button"
                    className={`osk-key osk-key-mod${shift ? " is-active" : ""}`}
                    disabled={disabled}
                    onClick={() => setShift((v) => !v)}
                    aria-pressed={shift}
                  >
                    ⇧
                  </button>
                )}
                {rowIndex === 2 && (
                  <button
                    type="button"
                    className={`osk-key osk-key-mod${symbols ? " is-active" : ""}`}
                    disabled={disabled}
                    onClick={() => setSymbols((v) => !v)}
                    aria-pressed={symbols}
                  >
                    {symbols ? "ABC" : "123"}
                  </button>
                )}
                {row.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="osk-key"
                    disabled={disabled}
                    onClick={() => pressChar(key)}
                  >
                    {!symbols && (mode === "text" || mode === "email")
                      ? shift
                        ? key
                        : key.toLowerCase()
                      : key}
                  </button>
                ))}
                {rowIndex === 2 && (
                  <button
                    type="button"
                    className="osk-key osk-key-mod"
                    disabled={disabled}
                    onClick={onBackspace}
                  >
                    ⌫
                  </button>
                )}
              </div>
            ))}

            {mode === "email" && !symbols && (
              <div className="osk-row">
                {EMAIL_EXTRAS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="osk-key osk-key-email"
                    disabled={disabled}
                    onClick={() => onKey(key)}
                  >
                    {key}
                  </button>
                ))}
                <button
                  type="button"
                  className="osk-key osk-key-email osk-key-com"
                  disabled={disabled}
                  onClick={() => onKey(".com")}
                >
                  .com
                </button>
              </div>
            )}

            <div className="osk-row">
              <button
                type="button"
                className="osk-key osk-key-space"
                disabled={disabled}
                onClick={onSpace}
              >
                Space
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
