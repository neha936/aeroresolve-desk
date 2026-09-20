import { motion, useReducedMotion } from "framer-motion";

export default function AmbientBackground() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-(--color-bg)">
      <motion.div
        className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-[120px]"
        animate={
          prefersReducedMotion
            ? undefined
            : { x: [0, 60, 0], y: [0, 40, 0] }
        }
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-10rem] top-1/4 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[120px]"
        animate={
          prefersReducedMotion
            ? undefined
            : { x: [0, -50, 0], y: [0, 60, 0] }
        }
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-12rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-cyan-500/15 blur-[130px]"
        animate={
          prefersReducedMotion
            ? undefined
            : { x: [0, 40, 0], y: [0, -30, 0] }
        }
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 100%)",
        }}
      />
    </div>
  );
}
