"use client";

import { motion } from "motion/react";

export default function SuccessCelebration() {
  return (
    <motion.div
      className="flow-success"
      initial={{ opacity: 0, scale: 0.86, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: 0.92,
        y: 12,
        transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
      }}
      transition={{ type: "spring", stiffness: 360, damping: 18, mass: 0.7 }}
    >
      <motion.div
        className="flow-success-badge"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.18, 0.94, 1.05, 1], opacity: 1 }}
        transition={{
          duration: 0.85,
          times: [0, 0.35, 0.55, 0.75, 1],
          ease: [0.22, 1.2, 0.36, 1],
        }}
        aria-hidden
      >
        <svg viewBox="0 0 72 72" className="flow-success-check">
          <circle cx="36" cy="36" r="34" className="flow-success-ring" />
          <motion.path
            d="M20 37.5 L31 48.5 L52 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
          />
        </svg>
      </motion.div>

      <motion.h2
        className="flow-success-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
      >
        Thank You!
      </motion.h2>
      <motion.p
        className="flow-success-copy"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48, duration: 0.35 }}
      >
        Your participation has been recorded.
      </motion.p>
    </motion.div>
  );
}
