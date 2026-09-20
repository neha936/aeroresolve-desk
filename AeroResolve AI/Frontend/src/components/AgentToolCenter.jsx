import { motion } from "framer-motion";
import { Wrench, CheckCircle2, Loader2, Database, Plane, ShieldCheck, Zap, AlertTriangle } from "lucide-react";

const TOOL_GROUPS = [
  {
    category: "BOOKING TOOLS",
    icon: Database,
    color: "text-blue-400",
    tools: [
      { id: "get_customer", name: "get_customer", desc: "Retrieve passenger loyalty & history" },
      { id: "get_booking", name: "get_booking", desc: "Fetch active PNR record" },
    ],
  },
  {
    category: "FLIGHT TOOLS",
    icon: Plane,
    color: "text-cyan-400",
    tools: [
      { id: "get_flight_status", name: "get_flight_status", desc: "Live delay & cancellation status" },
    ],
  },
  {
    category: "POLICY TOOLS",
    icon: ShieldCheck,
    color: "text-violet-400",
    tools: [
      { id: "evaluate_policy", name: "evaluate_policy", desc: "Evaluate policy & entitlement rules" },
    ],
  },
  {
    category: "ACTION TOOLS",
    icon: Zap,
    color: "text-emerald-400",
    tools: [
      { id: "rebook", name: "rebook", desc: "Rebook to next flight" },
      { id: "refund", name: "refund", desc: "Initiate full refund" },
      { id: "meal_voucher", name: "meal_voucher", desc: "Issue ₹500 meal voucher" },
      { id: "lounge_access", name: "lounge_access", desc: "Grant airport lounge access" },
      { id: "hotel_support", name: "hotel_support", desc: "Arrange hotel for delay > 5h" },
    ],
  },
  {
    category: "ESCALATION",
    icon: AlertTriangle,
    color: "text-amber-400",
    tools: [
      { id: "create_escalation", name: "create_escalation", desc: "Escalate for supervisor approval" },
    ],
  },
];

export default function AgentToolCenter({ activeTool = null, executedTools = [] }) {
  return (
    <div className="w-full rounded-2xl glass p-4 border border-white/10 bg-black/40 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
            <Wrench size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">AGENT TOOL CENTER</h3>
            <p className="text-[10px] text-white/40">Controlled tool execution engine</p>
          </div>
        </div>
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-white/10">
          {executedTools.length} / 10 EXECUTED
        </span>
      </div>

      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
        {TOOL_GROUPS.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.category} className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50">
                <GroupIcon size={12} className={group.color} />
                <span>{group.category}</span>
              </div>

              <div className="grid gap-1.5">
                {group.tools.map((tool) => {
                  const isExecuting = activeTool === tool.id;
                  const isExecuted = executedTools.includes(tool.id);

                  return (
                    <motion.div
                      key={tool.id}
                      whileHover={{ x: 2 }}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all border ${
                        isExecuting
                          ? "bg-cyan-500/10 border-cyan-400/50 text-cyan-200 shadow-md shadow-cyan-500/10"
                          : isExecuted
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          : "bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="font-mono font-semibold">
                          {isExecuting ? (
                            <Loader2 size={13} className="animate-spin text-cyan-400" />
                          ) : isExecuted ? (
                            <CheckCircle2 size={13} className="text-emerald-400" />
                          ) : (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/30" />
                          )}
                        </div>
                        <div>
                          <p className="font-mono text-[11px] font-bold tracking-tight text-white/90">
                            {tool.name}()
                          </p>
                          <p className="text-[10px] text-white/40">{tool.desc}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold ${
                            isExecuting
                              ? "bg-cyan-400/20 text-cyan-300"
                              : isExecuted
                              ? "bg-emerald-400/20 text-emerald-300"
                              : "bg-white/5 text-white/30"
                          }`}
                        >
                          {isExecuting ? "EXECUTING..." : isExecuted ? "VERIFIED" : "READY"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
