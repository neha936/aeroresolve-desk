import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  RefreshCw,
  IndianRupee,
  Utensils,
  Building2,
  Armchair,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function AgentDecisionCard({
  resolution,
  onRebook,
  onRefund,
  onEscalate,
  actionDone,
  actionInProgress,
}) {
  const [chosen, setChosen] = useState(null);

  if (!resolution) return null;

  const isCancellation = resolution.entitlement === "AIRLINE_CANCELLATION";
  const isDelay = resolution.entitlement === "DELAY";
  const entitlements = resolution.entitlements || [];

  // Map entitlement objects to a set of types for easy lookup
  const entitlementTypes = new Set(entitlements.map((e) => e.type));

  function handleRebook() {
    setChosen("rebook");
    onRebook?.();
  }

  function handleRefund() {
    setChosen("refund");
    onRefund?.();
  }

  const currentlyExecuting = actionInProgress && chosen;

  return (
    <div className="w-full rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/50 via-black/70 to-slate-950/70 backdrop-blur-xl p-6 space-y-5 shadow-2xl shadow-violet-950/30">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/20">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 block">
              POLICY ENGINE — EVALUATION COMPLETE
            </span>
            <h3 className="text-base font-bold text-white">✦ AGENT DECISION &amp; RESOLUTION</h3>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
          POLICY VERIFIED
        </span>
      </div>

      {/* POLICY SUMMARY */}
      <div className="rounded-xl bg-white/[0.03] p-4 border border-white/5">
        <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-1.5">
          Evaluation Summary
        </p>
        <p className="text-sm text-white/90 leading-relaxed">
          {isCancellation &&
            "Flight cancelled by airline. Passenger is entitled to choose between a free rebooking on the next available flight within 24 hours, or a full refund to the original payment method."}
          {isDelay &&
            `Flight delayed. Passenger is entitled to the following benefits under the airline's disruption policy.`}
          {!isCancellation && !isDelay && "Policy evaluation completed based on airline disruption policy guidelines."}
        </p>
        {resolution.loyalty?.priorityRebooking && (
          <p className="mt-1.5 text-xs text-amber-300 flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
            Gold/Platinum priority rebooking applied
          </p>
        )}
      </div>

      {/* ACTION EXECUTION STATE — shown when customer has chosen and action is in flight */}
      <AnimatePresence>
        {currentlyExecuting && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-cyan-500/10 p-4 border border-cyan-400/40 space-y-2 font-mono text-xs"
          >
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <Loader2 size={15} className="animate-spin" />
              <span>⚡ AGENT EXECUTION — {chosen === "rebook" ? "REBOOK_FLIGHT" : "INITIATE_REFUND"}()</span>
            </div>
            <div className="space-y-1 text-[11px] pl-6 border-l border-white/10">
              <p className="text-emerald-400">✓ Booking record verified</p>
              <p className="text-emerald-400">✓ Policy eligibility confirmed</p>
              <p className="text-cyan-300 animate-pulse">● Calling backend action service...</p>
              <p className="text-white/40">○ Verifying result...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTION COMPLETED STATE */}
      <AnimatePresence>
        {actionDone && chosen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/30 flex items-center gap-3"
          >
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-200">✓ ACTION COMPLETED</p>
              <p className="text-xs text-white/60">
                {chosen === "rebook"
                  ? "Rebooking request successfully submitted. Next available flight within 24 hours will be confirmed."
                  : "Full refund request successfully processed. Amount will be credited within 7 business days."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CANCELLATION — RESOLUTION CHOICE */}
      {isCancellation && !actionDone && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
            2 ELIGIBLE RESOLUTIONS — CUSTOMER CHOICE REQUIRED
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* REBOOK */}
            <motion.div
              whileHover={{ scale: chosen ? 1 : 1.02 }}
              className={`flex flex-col justify-between rounded-xl p-4 border transition-all cursor-pointer ${
                chosen === "rebook"
                  ? "bg-violet-600/20 border-violet-400/60"
                  : "bg-white/[0.02] border-violet-500/30 hover:border-violet-400/60"
              }`}
              onClick={chosen ? undefined : handleRebook}
            >
              <div>
                <div className="flex items-center gap-2 text-violet-300 font-bold text-sm mb-2">
                  <RefreshCw size={16} />
                  <span>✈ Free Rebook</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Next available flight within 24 hours at no extra cost.
                  {resolution.loyalty?.priorityRebooking && (
                    <span className="text-amber-300"> Priority handling.</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); if (!chosen) handleRebook(); }}
                disabled={!!chosen}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {chosen === "rebook" ? (
                  <><Loader2 size={14} className="animate-spin" /> Processing...</>
                ) : (
                  <><span>Select Rebook</span><ArrowRight size={14} /></>
                )}
              </button>
            </motion.div>

            {/* REFUND */}
            <motion.div
              whileHover={{ scale: chosen ? 1 : 1.02 }}
              className={`flex flex-col justify-between rounded-xl p-4 border transition-all cursor-pointer ${
                chosen === "refund"
                  ? "bg-emerald-600/20 border-emerald-400/60"
                  : "bg-white/[0.02] border-emerald-500/30 hover:border-emerald-400/60"
              }`}
              onClick={chosen ? undefined : handleRefund}
            >
              <div>
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm mb-2">
                  <IndianRupee size={16} />
                  <span>₹ Full Refund</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  100% refund to original payment method within 7 business days.
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); if (!chosen) handleRefund(); }}
                disabled={!!chosen}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/40 py-2.5 text-xs font-bold text-emerald-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {chosen === "refund" ? (
                  <><Loader2 size={14} className="animate-spin" /> Processing...</>
                ) : (
                  <><span>Request Refund</span><ArrowRight size={14} /></>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* DELAY — ENTITLEMENT BENEFITS */}
      {isDelay && entitlements.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">
            {entitlements.length} ELIGIBLE BENEFIT{entitlements.length > 1 ? "S" : ""} — AUTO-APPLIED BY AGENT
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {entitlementTypes.has("MEAL_VOUCHER") && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Utensils size={15} /> Meal Voucher
                </div>
                <p className="text-[11px] text-white/60">
                  ₹{entitlements.find((e) => e.type === "MEAL_VOUCHER")?.amountInr || 500} dining credit
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                  <CheckCircle2 size={12} /> APPLIED
                </div>
              </div>
            )}
            {entitlementTypes.has("LOUNGE_ACCESS") && (
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <Armchair size={15} /> Lounge Access
                </div>
                <p className="text-[11px] text-white/60">Airport lounge for delay duration</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                  <CheckCircle2 size={12} /> APPLIED
                </div>
              </div>
            )}
            {entitlementTypes.has("HOTEL_ACCOMMODATION") && (
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                  <Building2 size={15} /> Hotel Stay
                </div>
                <p className="text-[11px] text-white/60">Covers delayed hours only</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                  <CheckCircle2 size={12} /> APPLIED
                </div>
              </div>
            )}
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2">
            <Zap size={15} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-200 font-medium">
              All eligible entitlements have been automatically applied to booking #{resolution.pnr || "—"} by the agent.
            </p>
          </div>
        </div>
      )}

      {/* ESCALATE FOOTER */}
      {onEscalate && (
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-white/40">Fare waiver &gt; ₹1,500? Need a policy exception?</span>
          <button
            type="button"
            onClick={onEscalate}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors cursor-pointer"
          >
            <ShieldAlert size={14} />
            Escalate to Supervisor
          </button>
        </div>
      )}
    </div>
  );
}
