import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  MessageCircle,
  Plane,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { agentApi, bookingApi, customerApi } from "../services/api";
import { pnrStorage } from "../utils/storage";
import { useAuth } from "../hooks/useAuth";
import GlassCard from "../components/GlassCard";
import ActionButton from "../components/ActionButton";
import BookingCard from "../components/BookingCard";
import DisruptionBanner from "../components/DisruptionBanner";
import FloatingAircraft from "../components/FloatingAircraft";
import LoadingScreen from "../components/LoadingScreen";
import StatusBadge from "../components/StatusBadge";

const DEMO_CASES = [
  { pnr: "SK4821X", passenger: "Priya Nair", flight: "SK-204", route: "DEL → GOI", status: "cancelled", issue: "Flight Cancelled", tier: "Gold" },
  { pnr: "TR1190B", passenger: "Arvind Kulkarni", flight: "SK-118", route: "BOM → BLR", status: "delayed", delay: "240 mins", issue: "4h Delay", tier: "Silver" },
  { pnr: "WL7742", passenger: "Meher Kaur", flight: "SK-305", route: "DEL → HYD", status: "delayed", delay: "360 mins", issue: "6h Delay + Hotel Waiver", tier: "Platinum" },
];

const RECENT_ACTIVITIES = [
  { time: "Just now", text: "Case #SK4821X policy evaluated — Rebook & Refund available", type: "RESOLVED", icon: CheckCircle2, color: "text-emerald-400" },
  { time: "2 mins ago", text: "Meal voucher ₹500 & Lounge access issued for #TR1190B", type: "ACTION", icon: Zap, color: "text-cyan-400" },
  { time: "5 mins ago", text: "Supervisor review created for #WL7742 (Fare waiver > ₹1,500)", type: "ESCALATION", icon: AlertTriangle, color: "text-amber-400" },
  { time: "12 mins ago", text: "Autonomous resolution workflow completed for #SK-204", type: "SYSTEM", icon: Activity, color: "text-violet-400" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pnrInput, setPnrInput] = useState(pnrStorage.get() || "SK4821X");
  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [resolution, setResolution] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookupBooking(pnr) {
    if (!pnr) return;
    setLoading(true);
    setError("");
    setResolution(null);
    try {
      const [bookingRes, customerRes] = await Promise.all([
        bookingApi.getByPnr(pnr),
        customerApi.getByPnr(pnr),
      ]);
      setBooking(bookingRes.data);
      setCustomer(customerRes.data);
      pnrStorage.set(pnr);

      const flight = bookingRes.data.flight;
      const isDisrupted =
        flight?.status === "cancelled" || (flight?.status === "delayed" && flight?.delayMinutes > 0);
      if (isDisrupted) {
        fetchResolution(pnr);
      }
    } catch (err) {
      setError(err.message);
      setBooking(null);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchResolution(pnr) {
    try {
      const res = await agentApi.chat(pnr, "What are my options for this disruption?");
      setResolution(res.data.resolution);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const initialPnr = pnrStorage.get() || "SK4821X";
    lookupBooking(initialPnr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    lookupBooking(pnrInput.trim().toUpperCase());
  }

  function launchAgentCommandCenter(targetPnr) {
    const p = targetPnr || booking?.pnr || pnrInput;
    pnrStorage.set(p);
    navigate("/chat", { state: { pnr: p } });
  }

  return (
    <div className="space-y-8">
      {/* HERO SECTION */}
      <section className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-300 border border-violet-500/30 flex items-center gap-1.5">
              <Sparkles size={13} /> AIRLINE OPERATIONS AI PLATFORM
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {greeting()}, <span className="text-gradient">{user?.fullName?.split(" ")[0] || "Operator"}</span>
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Autonomous resolution &amp; disruption control center.
          </p>

          <form onSubmit={handleSearch} className="mt-6 max-w-md">
            <GlassCard className="flex items-center gap-2 p-2 border-violet-500/30">
              <Search size={16} className="ml-2 text-white/40" />
              <input
                value={pnrInput}
                onChange={(event) => setPnrInput(event.target.value)}
                placeholder="Enter PNR e.g. SK4821X, TR1190B, WL7742"
                className="flex-1 bg-transparent px-1 py-2 text-sm outline-none placeholder-white/30 font-mono"
              />
              <ActionButton type="submit" loading={loading} className="px-4 py-2 btn-gradient">
                Load Case
              </ActionButton>
            </GlassCard>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[11px] text-white/40 font-mono">DEMO CASES:</span>
              {DEMO_CASES.map((c) => (
                <button
                  key={c.pnr}
                  type="button"
                  onClick={() => {
                    setPnrInput(c.pnr);
                    lookupBooking(c.pnr);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition-all border cursor-pointer ${
                    booking?.pnr === c.pnr
                      ? "bg-violet-600/30 border-violet-400 text-white"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {c.pnr}
                </button>
              ))}
            </div>
          </form>
        </motion.div>

        <FloatingAircraft />
      </section>

      {/* TOP OPERATIONS METRICS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-4 border-violet-500/30 bg-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">ACTIVE CASES</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
              <Database size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-white">3</p>
          <p className="text-[10px] text-white/40 mt-1">Assignment PNR workloads</p>
        </GlassCard>

        <GlassCard className="p-4 border-emerald-500/30 bg-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">RESOLVED CASES</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-emerald-300">2</p>
          <p className="text-[10px] text-white/40 mt-1">Rebook &amp; Refund ready</p>
        </GlassCard>

        <GlassCard className="p-4 border-amber-500/30 bg-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">PENDING ESCALATIONS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-amber-300">1</p>
          <p className="text-[10px] text-white/40 mt-1">Supervisor review required</p>
        </GlassCard>

        <GlassCard className="p-4 border-cyan-500/30 bg-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">AGENT ACTIONS</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
              <Zap size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-cyan-300">8</p>
          <p className="text-[10px] text-white/40 mt-1">Vouchers &amp; Rebooks executed</p>
        </GlassCard>
      </section>

      {/* DISRUPTION OVERVIEW & RECENT AGENT ACTIVITY */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* LIVE DISRUPTION OVERVIEW */}
        <GlassCard className="p-6 space-y-4 border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Plane size={18} className="text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">LIVE DISRUPTION OVERVIEW</h2>
            </div>
            <span className="text-[11px] font-mono text-white/40">AIRLINE FLIGHT MONITORS</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-rose-500/10 p-3.5 border border-rose-500/30 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300">CANCELLED FLIGHTS</p>
              <p className="text-xl font-bold font-mono text-white">1</p>
              <p className="text-[11px] text-white/60">Flight SK-204 (DEL → GOI)</p>
            </div>

            <div className="rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/30 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">DELAYED FLIGHTS (&gt;3H)</p>
              <p className="text-xl font-bold font-mono text-white">2</p>
              <p className="text-[11px] text-white/60">SK-118 (4h) &amp; SK-305 (6h)</p>
            </div>

            <div className="rounded-xl bg-violet-500/10 p-3.5 border border-violet-500/30 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">AT-RISK FLIGHTS</p>
              <p className="text-xl font-bold font-mono text-white">0</p>
              <p className="text-[11px] text-white/60">Monitored in real-time</p>
            </div>
          </div>

          {/* ACTIVE DEMO CASES LIST */}
          <div className="pt-2 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white/50">ACTIVE ASSIGNMENT CASES</p>
            <div className="grid gap-2.5">
              {DEMO_CASES.map((c) => (
                <div
                  key={c.pnr}
                  onClick={() => launchAgentCommandCenter(c.pnr)}
                  className="flex items-center justify-between rounded-xl bg-white/[0.02] hover:bg-white/[0.05] p-3 border border-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 font-mono font-bold text-xs">
                      {c.pnr}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {c.passenger} <span className="text-white/40">({c.tier})</span>
                      </p>
                      <p className="text-[11px] text-white/50 font-mono">
                        {c.flight} • {c.route}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        c.status === "cancelled"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {c.issue}
                    </span>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-bold text-violet-300 group-hover:text-cyan-300"
                    >
                      <span>Launch Agent</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* RECENT AGENT ACTIVITY */}
        <GlassCard className="p-6 space-y-4 border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-violet-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">RECENT AGENT ACTIVITY</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAM
            </span>
          </div>

          <div className="space-y-3 font-sans text-xs">
            {RECENT_ACTIVITIES.map((act, idx) => {
              const Icon = act.icon;
              return (
                <div key={idx} className="flex items-start gap-3 rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <div className={`mt-0.5 shrink-0 ${act.color}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-white/90 font-medium leading-tight">{act.text}</p>
                    <p className="text-[10px] font-mono text-white/40">{act.time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => launchAgentCommandCenter()}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl btn-gradient py-3 text-xs font-bold text-white shadow-lg cursor-pointer"
          >
            <Sparkles size={15} />
            <span>Open Autonomous Agent Command Center</span>
          </button>
        </GlassCard>
      </div>

      {/* SELECTED BOOKING DISPLAY */}
      {loading && (
        <div className="py-10">
          <LoadingScreen label="Retrieving PNR Record" />
        </div>
      )}

      {!loading && booking && (
        <div className="space-y-6">
          <BookingCard booking={booking} />
          {resolution && (
            <DisruptionBanner flight={booking.flight}>
              <ActionButton
                icon={MessageCircle}
                className="mt-4 btn-gradient"
                onClick={() => launchAgentCommandCenter(booking.pnr)}
              >
                Launch Agent Command Center for #{booking.pnr}
              </ActionButton>
            </DisruptionBanner>
          )}
        </div>
      )}
    </div>
  );
}
