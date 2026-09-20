import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ShieldAlert,
  X,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Bot,
  CheckCircle2,
} from "lucide-react";
import { agentApi, bookingApi, customerApi, escalationApi } from "../services/api";
import { pnrStorage } from "../utils/storage";
import { formatResolutionMessage } from "../utils/resolutionMessage";
import GlassCard from "../components/GlassCard";
import ActionButton from "../components/ActionButton";
import LoadingScreen from "../components/LoadingScreen";

import AgentHeader from "../components/AgentHeader";
import AgentStateMachine from "../components/AgentStateMachine";
import AgentToolCenter from "../components/AgentToolCenter";
import AgentTraceDrawer from "../components/AgentTraceDrawer";
import CaseContextPanel from "../components/CaseContextPanel";
import AgentDecisionCard from "../components/AgentDecisionCard";
import ChatWindow from "../components/ChatWindow";

let messageId = 0;
const nextId = () => `msg-${Date.now()}-${messageId++}`;

function ts() {
  return new Date().toTimeString().split(" ")[0];
}

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const pnr = location.state?.pnr || pnrStorage.get();

  // --- Core data ---
  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- Chat ---
  const [messages, setMessages] = useState([]);
  const [resolution, setResolution] = useState(location.state?.resolution || null);
  const [conversationId, setConversationId] = useState(location.state?.conversationId || null);
  const [isTyping, setIsTyping] = useState(false);
  const [aiEscalation, setAiEscalation] = useState(null);
  const [chatOpen, setChatOpen] = useState(true);

  // --- Agent Command Center state ---
  const [agentStatus, setAgentStatus] = useState("LOADING CONTEXT");
  const [pipelineStep, setPipelineStep] = useState("CONTEXT");
  const [completedSteps, setCompletedSteps] = useState(["UNDERSTAND"]);
  const [activeTool, setActiveTool] = useState(null);
  const [executedTools, setExecutedTools] = useState([]);
  const [traces, setTraces] = useState([
    { id: 1, time: ts(), event: "Case initialized", type: "SYSTEM", status: "completed" },
  ]);

  // --- Action state (drives AgentDecisionCard) ---
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionDone, setActionDone] = useState(false);

  // --- Escalation modal ---
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalating, setEscalating] = useState(false);
  const [escalateError, setEscalateError] = useState("");

  const hasBootstrapped = useRef(false);

  function addTrace(event, type = "SYSTEM", status = "completed", details = "") {
    setTraces((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), time: ts(), event, type, status, details },
    ]);
  }

  function markToolDone(toolId) {
    setExecutedTools((prev) => [...new Set([...prev, toolId])]);
  }

  // ── 1. Load booking + customer ──────────────────────────────────────────
  useEffect(() => {
    if (!pnr) { setLoading(false); return; }

    (async () => {
      setLoading(true);
      setError("");
      setAgentStatus("LOADING CONTEXT");
      setPipelineStep("CONTEXT");

      addTrace(`Initiating case for PNR ${pnr}`, "SYSTEM");

      try {
        setActiveTool("get_booking");
        addTrace(`get_booking(${pnr})`, "TOOL", "running");

        const [bookingRes, customerRes] = await Promise.all([
          bookingApi.getByPnr(pnr),
          customerApi.getByPnr(pnr),
        ]);

        setBooking(bookingRes.data);
        setCustomer(customerRes.data);

        markToolDone("get_booking");
        markToolDone("get_customer");
        markToolDone("get_flight_status");
        setActiveTool(null);

        addTrace(`get_booking(${pnr}) → success`, "TOOL");
        addTrace(`get_customer(${pnr}) → success`, "TOOL");
        addTrace(`get_flight_status → ${bookingRes.data.flight?.status?.toUpperCase()}`, "TOOL");

        setCompletedSteps(["UNDERSTAND", "CONTEXT", "VERIFY"]);
        setPipelineStep("POLICY");
        setAgentStatus("CHECKING POLICY");
      } catch (err) {
        setError(err.message);
        addTrace(`Context load failed: ${err.message}`, "ERROR", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pnr]);

  // ── 2. Bootstrap: auto-trigger disruption evaluation ───────────────────
  useEffect(() => {
    if (!booking || !customer || hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    const firstName = customer.name?.split(" ")[0];

    // If resolution was passed in from dashboard, render it directly
    if (resolution) {
      setMessages([
        { id: nextId(), role: "agent", content: formatResolutionMessage(resolution, firstName, booking.flight) },
      ]);
      setCompletedSteps(["UNDERSTAND", "CONTEXT", "VERIFY", "POLICY", "DECISION"]);
      setPipelineStep("DECISION");
      setAgentStatus("RESOLUTION READY");
      markToolDone("evaluate_policy");
      addTrace("Policy evaluation pre-loaded from session", "POLICY");

      if (location.state?.prefill) {
        callAgentChat(location.state.prefill);
      }
      return;
    }

    const flight = booking.flight;
    const isDisrupted =
      flight?.status === "cancelled" || (flight?.status === "delayed" && flight?.delayMinutes > 0);

    if (isDisrupted) {
      // Auto-send to the AI agent for policy evaluation
      callAgentChat("Hello, can you help me with my flight disruption?", true);
    } else {
      setMessages([
        {
          id: nextId(),
          role: "agent",
          content: `Hi ${firstName}. Your booking ${booking.pnr} looks all set — no active disruptions. Let me know if you need anything.`,
        },
      ]);
      setAgentStatus("WAITING FOR CUSTOMER");
      setCompletedSteps(["UNDERSTAND", "CONTEXT", "VERIFY", "POLICY", "DECISION"]);
      setPipelineStep("DECISION");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, customer]);

  // ── 3. Core agent chat call (UPDATED TO PREVENT 422 ERROR) ──────────────
  async function callAgentChat(text, silent = false) {
    // Check and fallback for active PNR to ensure payload has valid PNR value
    const activePnr = pnr || booking?.pnr || pnrStorage.get();

    if (!activePnr) {
      console.error("Agent Chat Error: PNR is missing!");
      addTrace("Chat request cancelled: Missing PNR context", "ERROR", "error");
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "agent",
          content: "Unable to process chat: Active PNR context is missing. Please select a booking from the dashboard.",
        },
      ]);
      return;
    }

    if (!silent) {
      setMessages((prev) => [...prev, { id: nextId(), role: "user", content: text }]);
    }

    setIsTyping(true);
    setAgentStatus("CHECKING POLICY");
    setActiveTool("evaluate_policy");
    setPipelineStep("POLICY");
    addTrace(`evaluate_policy(message="${text.substring(0, 40)}...")`, "TOOL", "running");

    try {
      // Send verified activePnr to backend endpoint
      const res = await agentApi.chat(activePnr, text, conversationId);

      const data = res.data; // axios interceptor unwraps { success, data }

      setConversationId(data.conversationId);

      if (data.resolution) {
        setResolution(data.resolution);
      }

      markToolDone("evaluate_policy");
      setActiveTool(null);

      addTrace("evaluate_policy() → completed", "TOOL");

      if (data.escalation) {
        setAiEscalation(data.escalation);
        markToolDone("create_escalation");
        setAgentStatus("SUPERVISOR REVIEW");
        addTrace(
          `create_escalation() → id=${data.escalation.id || "created"}`,
          "ESCALATION"
        );
        setCompletedSteps(["UNDERSTAND", "CONTEXT", "VERIFY", "POLICY", "DECISION"]);
        setPipelineStep("DECISION");
      } else {
        setCompletedSteps(["UNDERSTAND", "CONTEXT", "VERIFY", "POLICY", "DECISION"]);
        setPipelineStep("DECISION");
        setAgentStatus("RESOLUTION READY");
      }

      // Prefer Gemini-generated message; fallback to formatter
      const firstName = customer?.name?.split(" ")[0];
      const content =
        data.aiMessage ||
        formatResolutionMessage(data.resolution || resolution, firstName, booking?.flight);

      setMessages((prev) => [...prev, { id: nextId(), role: "agent", content }]);
    } catch (err) {
      setActiveTool(null);
      setAgentStatus("WAITING FOR CUSTOMER");
      addTrace(`Agent error: ${err.message}`, "ERROR", "error");
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "agent", content: `Sorry, something went wrong: ${err.message}` },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  // Public-facing sendMessage (from ChatWindow)
  function sendMessage(text) {
    if (actionDone) {
      // After an action is done, subsequent messages continue normally
    }
    callAgentChat(text);
  }

  // ── 4. Customer selects Rebook ──────────────────────────────────────────
  function handleRebook() {
    if (actionDone || actionInProgress) return;
    setActionInProgress(true);
    setActiveTool("rebook");
    setPipelineStep("ACTION");
    setAgentStatus("EXECUTING");
    setCompletedSteps(["UNDERSTAND", "CONTEXT", "VERIFY", "POLICY", "DECISION"]);
    addTrace("rebook() — customer selected rebooking", "ACTION", "running");

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: "I'd like to rebook my flight." },
    ]);

    setTimeout(() => {
      markToolDone("rebook");
      setActiveTool(null);
      setActionDone(true);
      setActionInProgress(false);

      addTrace("rebook() → rebooking request recorded", "ACTION");
      setCompletedSteps(["UNDERSTAND", "CONTEXT", "VERIFY", "POLICY", "DECISION", "ACTION", "VERIFY_RESULT"]);
      setPipelineStep("VERIFY_RESULT");
      setAgentStatus("COMPLETED");

      const firstName = customer?.name?.split(" ")[0];
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "agent",
          content: `Your rebooking request has been confirmed, ${firstName}. The airline will rebook you on the next available flight within 24 hours. A confirmation will be sent to your registered email.${resolution?.loyalty?.priorityRebooking ? " As a Gold member, your rebooking will be prioritised." : ""}`,
        },
      ]);
    }, 1400);
  }

  // ── 5. Customer selects Refund ──────────────────────────────────────────
  function handleRefund() {
    if (actionDone || actionInProgress) return;
    setActionInProgress(true);
    setActiveTool("refund");
    setPipelineStep("ACTION");
    setAgentStatus("EXECUTING");
    setCompletedSteps(["UNDERSTAND", "CONTEXT", "VERIFY", "POLICY", "DECISION"]);
    addTrace("refund() — customer selected full refund", "ACTION", "running");

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: "I'd like a full refund instead." },
    ]);

    setTimeout(() => {
      markToolDone("refund");
      setActiveTool(null);
      setActionDone(true);
      setActionInProgress(false);

      addTrace("refund() → refund request recorded", "ACTION");
      setCompletedSteps(["UNDERSTAND", "CONTEXT", "VERIFY", "POLICY", "DECISION", "ACTION", "VERIFY_RESULT"]);
      setPipelineStep("VERIFY_RESULT");
      setAgentStatus("COMPLETED");

      const firstName = customer?.name?.split(" ")[0];
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "agent",
          content: `Your full refund request has been initiated, ${firstName}. The amount will be credited to your original payment method within 7 business days. A refund confirmation will be sent to your registered email.`,
        },
      ]);
    }, 1400);
  }

  // ── 6. Escalation ──────────────────────────────────────────────────────
  async function handleEscalate(event) {
    event.preventDefault();
    if (!escalateReason.trim()) return;
    setEscalating(true);
    setEscalateError("");
    setActiveTool("create_escalation");
    addTrace("create_escalation() — supervisor review requested", "ESCALATION", "running");

    try {
      const res = await escalationApi.create(booking.id, escalateReason.trim(), {
        type: "SUPERVISOR_REVIEW",
        pnr: booking.pnr,
      });
      markToolDone("create_escalation");
      addTrace(`create_escalation() → id=${res.data.id}`, "ESCALATION");
      navigate("/escalations", { state: { escalationId: res.data.id } });
    } catch (err) {
      setEscalateError(err.message);
      addTrace(`create_escalation() failed: ${err.message}`, "ERROR", "error");
    } finally {
      setActiveTool(null);
      setEscalating(false);
    }
  }

  // ── Guards ──────────────────────────────────────────────────────────────
  if (!pnr) {
    return (
      <GlassCard className="p-10 text-center max-w-xl mx-auto mt-16">
        <Bot size={40} className="mx-auto mb-4 text-violet-400" />
        <h2 className="text-xl font-bold text-white">No Case Selected</h2>
        <p className="mt-2 text-sm text-white/50">
          Look up a PNR from the dashboard to launch the Agent Command Center.
        </p>
        <ActionButton className="mx-auto mt-6" onClick={() => navigate("/dashboard")}>
          Go to Operations Dashboard
        </ActionButton>
      </GlassCard>
    );
  }

  if (loading) return <LoadingScreen label="Launching Autonomous Agent — Loading Case Context" />;

  if (error) {
    return (
      <GlassCard className="p-10 text-center max-w-xl mx-auto mt-16">
        <AlertCircle size={40} className="mx-auto mb-4 text-rose-400" />
        <h2 className="text-xl font-bold text-white">Unable to Load Case</h2>
        <p className="mt-2 text-sm text-white/50">{error}</p>
        <ActionButton className="mx-auto mt-6" onClick={() => navigate("/dashboard")}>
          Return to Dashboard
        </ActionButton>
      </GlassCard>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-8">

      {/* ── AGENT HEADER ── */}
      <AgentHeader status={agentStatus} latency="94ms" />

      {/* ── EXECUTION PIPELINE ── */}
      <AgentStateMachine currentStep={pipelineStep} completedSteps={completedSteps} />

      {/* ── 3-COLUMN COMMAND CENTER ── */}
      <div className="grid gap-5 lg:grid-cols-[280px_1fr_280px]">

        {/* LEFT: CASE CONTEXT */}
        <div className="space-y-5">
          <CaseContextPanel booking={booking} customer={customer} resolutionStatus={agentStatus} />
        </div>

        {/* CENTER: DECISION + ESCALATION BANNER */}
        <div className="space-y-5">
          {/* AI escalation auto-created by agent */}
          <AnimatePresence>
            {aiEscalation && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-amber-400/40 bg-amber-500/10 backdrop-blur-xl p-4 flex items-start gap-3"
              >
                <ShieldAlert className="shrink-0 text-amber-300 mt-0.5" size={20} />
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-bold text-amber-200">⚠ SUPERVISOR REVIEW REQUIRED</p>
                  <p className="text-xs text-white/60">
                    Agent authority limit exceeded. Case automatically escalated for supervisor approval.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate("/escalations", { state: { escalationId: aiEscalation.id } })
                  }
                  className="shrink-0 flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
                >
                  View Status <CheckCircle2 size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Agent Decision Card */}
          {resolution ? (
            <AgentDecisionCard
              resolution={resolution}
              actionInProgress={actionInProgress}
              actionDone={actionDone}
              onRebook={handleRebook}
              onRefund={handleRefund}
              onEscalate={() => setEscalateOpen(true)}
            />
          ) : isTyping ? (
            <GlassCard className="p-8 text-center space-y-3">
              <div className="flex justify-center gap-1.5">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full bg-violet-400"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-white/80">Agent is evaluating policy...</p>
              <p className="text-xs text-white/40 font-mono">evaluate_policy() running</p>
            </GlassCard>
          ) : (
            <GlassCard className="p-8 text-center space-y-3">
              <Bot size={32} className="mx-auto text-violet-400 animate-pulse" />
              <p className="text-sm font-semibold text-white/80">Awaiting Policy Evaluation</p>
              <p className="text-xs text-white/40">
                Agent will evaluate booking details against airline disruption policy.
              </p>
            </GlassCard>
          )}
        </div>

        {/* RIGHT: TOOL CENTER + TRACE */}
        <div className="space-y-5">
          <AgentToolCenter activeTool={activeTool} executedTools={executedTools} />
          <AgentTraceDrawer traces={traces} />
        </div>
      </div>

      {/* ── COLLAPSIBLE CUSTOMER CONVERSATION ── */}
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setChatOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer border-b border-white/10"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
              <MessageSquare size={14} />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                CUSTOMER CONVERSATION
              </h3>
              <p className="text-[10px] text-white/40">
                {messages.length} message{messages.length !== 1 ? "s" : ""} — live stream
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
            <span>{chatOpen ? "Collapse" : "Expand"}</span>
            {chatOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {chatOpen && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 420 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="h-[420px] p-4">
                <ChatWindow
                  messages={messages}
                  onSend={sendMessage}
                  isTyping={isTyping}
                  disabled={actionInProgress}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── ESCALATION MODAL ── */}
      <AnimatePresence>
        {escalateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <GlassCard className="w-full max-w-md p-6 border-amber-500/30 bg-slate-950/95">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="text-amber-400" size={20} />
                    <p className="font-bold text-white">Escalate to Supervisor</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEscalateOpen(false)}
                    className="text-white/40 hover:text-white cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 mb-4 text-xs text-amber-200 space-y-1">
                  <p className="font-bold">⚠ When to escalate:</p>
                  <ul className="list-disc list-inside text-white/60 space-y-0.5">
                    <li>Fare difference waiver exceeds ₹1,500</li>
                    <li>Legal threats or formal complaints</li>
                    <li>Non-airline-caused disruption exceptions</li>
                    <li>Refund to a different payment method</li>
                  </ul>
                </div>

                <form onSubmit={handleEscalate} className="space-y-3">
                  <textarea
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    rows={4}
                    placeholder="Describe the exception needed, e.g. fare difference waiver of ₹2,000 for voluntary rebooking..."
                    className="w-full rounded-xl bg-white/5 px-3.5 py-3 text-sm outline-none ring-1 ring-white/10 placeholder-white/30 focus:ring-amber-400/60"
                  />
                  {escalateError && (
                    <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 border border-rose-500/20">
                      <AlertCircle size={14} />
                      {escalateError}
                    </div>
                  )}
                  <ActionButton type="submit" loading={escalating} className="w-full">
                    Submit for Supervisor Review
                  </ActionButton>
                </form>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}