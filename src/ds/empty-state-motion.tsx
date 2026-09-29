"use client";

import { motion, useReducedMotion } from "framer-motion";

import { EmptyStateContent, type EmptyStateProps } from "./empty-state";

export default function AnimatedEmptyState(
  props: Omit<EmptyStateProps, "motion">,
) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <EmptyStateContent {...props} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <EmptyStateContent {...props} />
    </motion.div>
  );
}
