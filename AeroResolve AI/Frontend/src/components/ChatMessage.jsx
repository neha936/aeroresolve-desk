import { motion } from "framer-motion";
import { Bot, UserRound } from "lucide-react";

export default function ChatMessage({ role, content }) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
          isUser
            ? "bg-gradient-to-br from-violet-600 to-indigo-500 border-violet-400/30"
            : "bg-gradient-to-br from-cyan-600/40 to-violet-600/40 border-white/10"
        }`}
      >
        {isUser ? (
          <UserRound size={13} className="text-white" />
        ) : (
          <Bot size={13} className="text-cyan-200" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-violet-600 to-indigo-500 text-white rounded-br-sm shadow-lg shadow-violet-500/20"
            : "bg-white/[0.06] border border-white/10 text-white/90 rounded-bl-sm backdrop-blur-sm"
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}
