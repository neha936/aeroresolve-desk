import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SendHorizonal, Bot, Loader2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({ messages, onSend, isTyping, disabled }) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || disabled || isTyping) return;
    onSend(trimmed);
    setDraft("");
  }

  const QUICK_REPLIES = [
    "I want to rebook my flight",
    "I want a full refund",
    "What are my options?",
    "I need hotel accommodation",
  ];

  return (
    <div className="flex h-full flex-col rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/30 px-4 py-3 backdrop-blur-xl">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md">
          <Bot size={18} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-black" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">AeroResolve AI Agent</p>
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {isTyping ? "Agent is responding..." : "AI Resolution Assistant • Online"}
          </p>
        </div>
        {isTyping && (
          <div className="ml-auto">
            <Loader2 size={15} className="animate-spin text-violet-300" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto p-4 bg-gradient-to-b from-black/20 to-black/40"
      >
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8 space-y-2">
            <Bot size={28} className="text-violet-400 opacity-50" />
            <p className="text-xs text-white/30">Conversation will appear here</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <ChatMessage key={message.id} role={message.role} content={message.content} />
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2.5"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600/40 to-violet-600/40 border border-white/10">
              <Bot size={13} className="text-cyan-200" />
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/10 px-4 py-3">
              <TypingIndicator />
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick replies */}
      {messages.length <= 1 && !isTyping && !disabled && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 border-t border-white/5 bg-black/20">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => onSend(reply)}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:border-violet-400/40 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-white/10 bg-black/30 p-3 backdrop-blur-xl"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={disabled ? "Action in progress..." : "Type your message…"}
          disabled={disabled || isTyping}
          className="flex-1 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus:ring-violet-400/60 disabled:opacity-40 transition-all"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
          }}
        />
        <motion.button
          whileHover={!disabled && !isTyping ? { scale: 1.05 } : undefined}
          whileTap={!disabled && !isTyping ? { scale: 0.95 } : undefined}
          type="submit"
          disabled={disabled || isTyping || !draft.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-violet-500/20"
        >
          {isTyping ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
        </motion.button>
      </form>
    </div>
  );
}
