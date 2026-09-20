import { motion } from "framer-motion";
import { Check, Loader2, Circle } from "lucide-react";

const PIPELINE_STEPS = [
  { id: "UNDERSTAND", label: "UNDERSTAND" },
  { id: "CONTEXT", label: "CONTEXT" },
  { id: "VERIFY", label: "VERIFY" },
  { id: "POLICY", label: "POLICY" },
  { id: "DECISION", label: "DECISION" },
  { id: "ACTION", label: "ACTION" },
  { id: "VERIFY_RESULT", label: "VERIFY RESULT" },
];

export default function AgentStateMachine({ currentStep = "DECISION", completedSteps = [] }) {
  const currentIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full rounded-2xl glass p-4 border border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-violet-400">
          EXECUTION PIPELINE STATE MACHINE
        </span>
        <span className="text-[10px] font-mono text-white/40">
          STEP {currentIndex >= 0 ? currentIndex + 1 : 1} OF {PIPELINE_STEPS.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {PIPELINE_STEPS.map((step, idx) => {
          const isCompleted =
            completedSteps.includes(step.id) || (currentIndex > idx && currentIndex !== -1);
          const isActive = currentStep === step.id;
          const isPending = !isCompleted && !isActive;

          return (
            <div key={step.id} className="relative flex flex-col items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex w-full flex-col items-center rounded-xl p-2.5 text-center transition-all ${
                  isActive
                    ? "bg-gradient-to-b from-violet-600/30 to-indigo-600/20 border border-violet-400/50 shadow-lg shadow-violet-500/10"
                    : isCompleted
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-white/[0.03] border border-white/5 text-white/40"
                }`}
              >
                <div className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-full">
                  {isCompleted ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : isActive ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                      <Loader2 size={12} className="animate-spin" />
                    </div>
                  ) : (
                    <Circle size={12} className="text-white/20" />
                  )}
                </div>

                <span
                  className={`text-[10px] font-bold tracking-wider ${
                    isActive
                      ? "text-cyan-300"
                      : isCompleted
                      ? "text-emerald-300"
                      : "text-white/40"
                  }`}
                >
                  {step.label}
                </span>

                <span className="mt-0.5 text-[9px] font-mono text-white/30">
                  {isCompleted ? "COMPLETED" : isActive ? "ACTIVE" : "PENDING"}
                </span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
