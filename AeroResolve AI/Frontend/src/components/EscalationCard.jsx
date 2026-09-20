import { motion } from "framer-motion";
import { Check, ShieldAlert } from "lucide-react";
import GlassCard from "./GlassCard";
import StatusBadge from "./StatusBadge";

const STEPS = [
  { key: "created", label: "Request Created" },
  { key: "review", label: "Under Review" },
  { key: "decision", label: "Supervisor Decision" },
];

function stepIndexForStatus(status) {
  switch (status?.toLowerCase()) {
    case "resolved":
      return 2;
    case "in_review":
      return 1;
    default:
      return 0;
  }
}

export default function EscalationCard({ escalation }) {
  if (!escalation) return null;
  const activeIndex = stepIndexForStatus(escalation.status);

  return (
    <GlassCard glow className="p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
          <ShieldAlert size={20} />
        </div>
        <div>
          <p className="text-lg font-bold">Supervisor Review Required</p>
          <p className="mt-1 text-sm text-white/60">{escalation.reason}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={escalation.status} />
        </div>
      </div>

      <div className="mt-8 flex items-center">
        {STEPS.map((step, index) => (
          <div key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2 text-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: index <= activeIndex ? "#8b5cf6" : "rgba(255,255,255,0.06)",
                  borderColor: index <= activeIndex ? "#8b5cf6" : "rgba(255,255,255,0.15)",
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
              >
                {index < activeIndex ? (
                  <Check size={16} />
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </motion.div>
              <span className="max-w-[6.5rem] text-xs font-medium text-white/60">
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className="mx-2 h-px flex-1 bg-white/10">
                <motion.div
                  className="h-px bg-violet-400"
                  initial={false}
                  animate={{ width: index < activeIndex ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/10 pt-6 text-sm sm:grid-cols-3">
        <div>
          <p className="text-white/40">Booking Reference</p>
          <p className="mt-1 font-mono font-semibold">{escalation.bookingId}</p>
        </div>
        <div>
          <p className="text-white/40">Requested Action</p>
          <p className="mt-1 font-semibold">
            {escalation.requestedAction?.type?.replaceAll("_", " ") || "General review"}
          </p>
        </div>
        <div>
          <p className="text-white/40">Submitted</p>
          <p className="mt-1 font-semibold">
            {new Date(escalation.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
