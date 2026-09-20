import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, X, Terminal, CheckCircle2, Clock, ChevronRight } from "lucide-react";

export default function AgentTraceDrawer({ traces = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full rounded-2xl glass p-4 border border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal size={15} className="text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">LIVE AGENT TRACE</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:text-violet-200 transition-colors cursor-pointer"
        >
          <span>View Full Trace</span>
          <ChevronRight size={13} />
        </button>
      </div>

      <div className="space-y-1.5 font-mono text-[11px]">
        {traces.length === 0 ? (
          <p className="text-white/40 text-xs italic py-2">No trace events recorded yet.</p>
        ) : (
          traces.slice(-4).map((trace, idx) => (
            <div
              key={trace.id || idx}
              className="flex items-center justify-between rounded-lg bg-white/[0.02] px-2.5 py-1.5 border border-white/5"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-[10px] text-white/40">{trace.time}</span>
                <span
                  className={
                    trace.status === "completed"
                      ? "text-emerald-400"
                      : trace.status === "running"
                      ? "text-cyan-400 animate-pulse"
                      : "text-amber-400"
                  }
                >
                  {trace.status === "completed" ? "✓" : trace.status === "running" ? "●" : "⚠"}
                </span>
                <span className="font-semibold text-white/90 truncate">{trace.event}</span>
              </div>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                {trace.type || "SYSTEM"}
              </span>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl glass border border-white/10 bg-slate-950/90 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Full Autonomous Operational Trace</h2>
                    <p className="text-xs text-white/40">Real-time audit log of agent operations &amp; tools</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 font-mono text-xs">
                {traces.map((trace, idx) => (
                  <div
                    key={trace.id || idx}
                    className="flex items-start justify-between rounded-xl bg-white/[0.03] p-3 border border-white/5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-[11px]">{trace.time}</span>
                        <span className="font-bold text-violet-300">[{trace.type || "EVENT"}]</span>
                        <span className="font-semibold text-white">{trace.event}</span>
                      </div>
                      {trace.details && (
                        <p className="text-white/60 text-[11px] pl-4 border-l border-white/10">
                          {trace.details}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {trace.status === "completed" ? (
                        <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20">
                          <CheckCircle2 size={11} /> COMPLETED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded text-[10px] border border-cyan-500/20">
                          <Clock size={11} /> ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl btn-gradient px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Close Trace
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
