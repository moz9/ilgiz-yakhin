"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** A hairline that shows how far the reader has come. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scale = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });

  return (
    <motion.div className="scroll-progress" style={{ scaleX: scale }} aria-hidden="true" />
  );
}
