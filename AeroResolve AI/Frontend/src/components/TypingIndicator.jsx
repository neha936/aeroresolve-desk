import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-0.5">
      {[0, 0.18, 0.36].map((delay, i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-violet-400"
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 0.75, delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
