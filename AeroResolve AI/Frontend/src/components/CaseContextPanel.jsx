import { motion } from "framer-motion";
import { User, ShieldAlert, Award, Plane, Clock, AlertCircle } from "lucide-react";

function getTierBadgeColor(tier) {
  switch (tier?.toUpperCase()) {
    case "PLATINUM":
      return "from-slate-300 via-gray-100 to-slate-400 text-slate-900 border-white/40";
    case "GOLD":
      return "from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border-amber-300/60";
    case "SILVER":
      return "from-slate-400 via-slate-300 to-slate-500 text-slate-950 border-slate-300/40";
    default:
      return "from-blue-600 to-indigo-600 text-white border-blue-400/30";
  }
}

export default function CaseContextPanel({ booking, customer, resolutionStatus = "RESOLVED" }) {
  if (!booking || !customer) return null;

  const { flight } = booking;
  const isCancelled = flight?.status === "cancelled";
  const isDelayed = flight?.status === "delayed" && flight?.delayMinutes > 0;

  return (
    <div className="w-full rounded-2xl glass p-5 border border-white/10 bg-black/40 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">OPERATIONAL CASE</span>
          <h2 className="text-xl font-black tracking-tight text-white font-mono">#{booking.pnr}</h2>
        </div>
        <div className="text-right">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              isCancelled
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : isDelayed
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            }`}
          >
            ● {flight?.status?.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-white/[0.03] p-3.5 border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
              <User size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{customer.name}</p>
              <p className="text-[11px] text-white/45">{customer.email}</p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-extrabold uppercase shadow-sm border ${getTierBadgeColor(
              customer.loyaltyTier
            )}`}
          >
            <Award size={11} />
            {customer.loyaltyTier}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2.5 border border-white/5">
          <span className="text-white/45 flex items-center gap-1.5">
            <Plane size={14} className="text-cyan-400" /> Flight
          </span>
          <span className="font-mono font-bold text-white">{flight?.flightNumber}</span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2.5 border border-white/5">
          <span className="text-white/45">Route</span>
          <span className="font-bold text-white">
            {flight?.origin} → {flight?.destination}
          </span>
        </div>

        {isDelayed && (
          <div className="flex items-center justify-between rounded-lg bg-amber-500/10 p-2.5 border border-amber-500/20 text-amber-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock size={14} /> Delay Duration
            </span>
            <span className="font-mono font-bold">{flight.delayMinutes} Mins ({Math.round(flight.delayMinutes / 60)}h)</span>
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2.5 border border-white/5">
          <span className="text-white/45">Issue Type</span>
          <span className="font-semibold text-white/90">
            {isCancelled ? "Flight Cancellation" : isDelayed ? "Flight Delay" : "Scheduled Trip"}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2.5 border border-white/5">
          <span className="text-white/45">Agent Status</span>
          <span className="font-mono font-bold text-cyan-300 uppercase">{resolutionStatus}</span>
        </div>
      </div>
    </div>
  );
}
