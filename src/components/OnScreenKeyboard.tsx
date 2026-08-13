"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export type KeyboardMode = "text" | "email" | "tel";

type OnScreenKeyboardProps = {
  mode: KeyboardMode;
  fieldKey: string;
  fieldLabel: string;
  value: string;
  shake?: boolean;
  showPreview?: boolean;
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

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function OnScreenKeyboard({
  mode,
  fieldKey,
  fieldLabel,
  value,
  shake = false,
  showPreview = true,
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
  }, [mode, fieldKey]);

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
      className={`osk-stage${showPreview ? "" : " osk-stage--inline"}`}
      animate={
        shake
          ? { x: [0, -14, 14, -10, 10, -6, 6, 0] }
          : { x: 0 }
      }
      transition={
        shake
          ? { duration: 0.45, ease: "easeInOut" }
          : { duration: 0.28, ease: easeOut }
      }
      onMouseDown={(e) => e.preventDefault()}
    >
      {showPreview && (
        <div className={`osk-preview${shake ? " is-shake" : ""}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={fieldKey}
              className="osk-preview-swap"
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.32, ease: easeOut }}
            >
              <span className="osk-preview-label">{fieldLabel}</span>
              <p className="osk-preview-value">
                {value || (
                  <span className="osk-preview-empty">Start typing…</span>
                )}
                <span className="osk-caret" aria-hidden />
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <div className={`osk${shake ? " is-shake" : ""}`}>
        <div className="osk-top">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={fieldKey}
              className="osk-meta"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: easeOut }}
            >
              <span className="osk-field">{fieldLabel}</span>
              <span className="osk-hint">{hint}</span>
            </motion.div>
          </AnimatePresence>
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

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${mode}-${symbols ? "sym" : "alpha"}`}
            className="osk-body"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: easeOut }}
          >
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
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
