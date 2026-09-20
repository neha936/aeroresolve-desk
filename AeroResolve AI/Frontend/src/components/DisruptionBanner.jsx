import { motion } from "framer-motion";
import { AlertTriangle, Clock } from "lucide-react";
import GlassCard from "./GlassCard";

const REASON_COPY = {
  cancelled: "Your flight has been cancelled due to operational reasons.",
  delayed: "Your flight has been delayed. Here's what AeroResolve can do for you.",
};

export default function DisruptionBanner({ flight, children }) {
  if (!flight) return null;
  const status = flight.status?.toLowerCase();
  if (status !== "cancelled" && !(status === "delayed" && flight.delayMinutes > 0)) {
    return null;
  }

  const isCancelled = status === "cancelled";

  return (
    <GlassCard
      className="border-l-2 border-l-rose-400/60 p-6 sm:p-8"
      style={{ borderLeftColor: isCancelled ? "#fb7185" : "#fbbf24" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isCancelled ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"
            }`}
          >
            <AlertTriangle size={20} />
          </motion.div>
          <div>
            <p className="text-lg font-bold">Flight disruption detected</p>
            <p className="mt-1 max-w-xl text-sm text-white/60">
              {REASON_COPY[status]}
            </p>
          </div>
        </div>

        {!isCancelled && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300">
            <Clock size={16} />
            Delayed by {Math.floor(flight.delayMinutes / 60)}h {flight.delayMinutes % 60}m
          </div>
        )}
      </div>

      {children && <div className="mt-6">{children}</div>}
    </GlassCard>
  );
}
