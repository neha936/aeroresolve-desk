import { motion } from "framer-motion";
import { Bot, Cpu, Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

export function getStatusBadge(status) {
  switch (status) {
    case "ANALYZING":
    case "LOADING CONTEXT":
    case "CHECKING POLICY":
    case "EXECUTING":
      return {
        label: status,
        color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        pulse: true,
        icon: Activity,
      };
    case "RESOLUTION READY":
    case "COMPLETED":
    case "DECISION":
      return {
        label: status,
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        pulse: false,
        icon: CheckCircle2,
      };
    case "SUPERVISOR REVIEW":
    case "ESCALATED":
      return {
        label: status,
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        pulse: false,
        icon: AlertTriangle,
      };
    case "WAITING FOR CUSTOMER":
    default:
      return {
        label: status || "AGENT ONLINE",
        color: "bg-violet-500/20 text-violet-300 border-violet-500/30",
        pulse: false,
        icon: Clock,
      };
  }
}

export default function AgentHeader({ status = "AGENT ONLINE", latency = "120ms" }) {
  const badge = getStatusBadge(status);
  const StatusIcon = badge.icon;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl glass p-4 border border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="flex items-center gap-3.5">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-violet-500/25">
          <Bot size={24} className="animate-pulse" />
          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-black">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1">
              ✦ AERORESOLVE AI AGENT
            </span>
            <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/50 border border-white/10">
              v2.4-AUTONOMOUS
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Autonomous Flight Resolution System
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/60">
          <Cpu size={14} className="text-cyan-400" />
          <span>LATENCY:</span>
          <span className="text-cyan-300 font-bold">{latency}</span>
        </div>

        <motion.div
          animate={badge.pulse ? { scale: [1, 1.03, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider ${badge.color}`}
        >
          <StatusIcon size={14} className={badge.pulse ? "animate-spin" : ""} />
          <span>{badge.label}</span>
        </motion.div>
      </div>
    </div>
  );
}
