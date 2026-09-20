import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, MapPin, Plane, PlaneLanding, PlaneTakeoff, RefreshCw } from "lucide-react";
import { bookingApi, customerApi } from "../services/api";
import { pnrStorage } from "../utils/storage";
import GlassCard from "../components/GlassCard";
import CustomerCard from "../components/CustomerCard";
import StatusBadge from "../components/StatusBadge";
import ActionButton from "../components/ActionButton";
import LoadingScreen from "../components/LoadingScreen";

function formatTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

export default function BookingDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const pnr = location.state?.pnr || pnrStorage.get();

  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [bookingRes, customerRes] = await Promise.all([
        bookingApi.getByPnr(pnr),
        customerApi.getByPnr(pnr),
      ]);
      setBooking(bookingRes.data);
      setCustomer(customerRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pnr) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pnr]);

  if (!pnr) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="font-semibold text-white/80">No booking selected</p>
        <p className="mt-1 text-sm text-white/45">Look up a PNR from your dashboard first.</p>
        <ActionButton className="mx-auto mt-5" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </ActionButton>
      </GlassCard>
    );
  }

  if (loading) return <LoadingScreen label="Loading booking details" />;

  if (error) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="text-white/70">Unable to load booking details.</p>
        <p className="mt-1 text-sm text-white/40">{error}</p>
        <ActionButton icon={RefreshCw} variant="secondary" className="mx-auto mt-5" onClick={load}>
          Try Again
        </ActionButton>
      </GlassCard>
    );
  }

  const { flight } = booking;
  const isDelayed = flight.status === "delayed" && flight.delayMinutes > 0;
  const newDeparture = isDelayed
    ? new Date(new Date(flight.departureTime).getTime() + flight.delayMinutes * 60000)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Booking Details</h1>
        <p className="mt-1 text-sm text-white/50">Everything about your trip, in one place.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-6">
          <CustomerCard customer={customer} />

          <GlassCard className="p-6">
            <p className="text-xs uppercase tracking-widest text-white/40">PNR</p>
            <p className="text-xl font-bold">{booking.pnr}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/45">Flight</span>
                <span className="font-medium">{flight.flightNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/45">Date</span>
                <span className="font-medium">{formatDate(flight.departureTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/45">Status</span>
                <StatusBadge status={flight.status} />
              </div>
            </div>
          </GlassCard>

          {isDelayed && (
            <GlassCard className="p-6">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-300">
                <Clock size={15} /> Delay Details
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-white/40">Original</p>
                  <p className="mt-1 font-bold">{formatTime(flight.departureTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40">New</p>
                  <p className="mt-1 font-bold text-amber-300">{formatTime(newDeparture)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Delay</p>
                  <p className="mt-1 font-bold">
                    {Math.floor(flight.delayMinutes / 60)}h {flight.delayMinutes % 60}m
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        <GlassCard tilt className="p-8">
          <p className="mb-8 text-sm font-semibold text-white/70">Journey Timeline</p>
          <div className="relative pl-8">
            <div className="absolute left-[13px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-400/60 via-white/15 to-blue-400/60" />

            <TimelineStep icon={MapPin} label="Origin" title={flight.origin} />
            <TimelineStep icon={PlaneTakeoff} label="Departure" title={formatTime(flight.departureTime)} />
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="relative mb-10 flex items-center gap-4"
            >
              <div className="absolute -left-8 flex h-7 w-7 items-center justify-center rounded-full btn-gradient text-white">
                <Plane size={13} />
              </div>
              <div className="ml-1">
                <p className="text-xs text-white/40">In transit</p>
                <p className="font-semibold">Flight {flight.flightNumber}</p>
              </div>
            </motion.div>
            <TimelineStep icon={PlaneLanding} label="Arrival" title={formatTime(flight.arrivalTime)} />
            <TimelineStep icon={MapPin} label="Destination" title={flight.destination} last />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function TimelineStep({ icon: Icon, label, title, last = false }) {
  return (
    <div className={`relative flex items-center gap-4 ${last ? "" : "mb-10"}`}>
      <div className="absolute -left-8 flex h-7 w-7 items-center justify-center rounded-full glass text-violet-300">
        <Icon size={13} />
      </div>
      <div className="ml-1">
        <p className="text-xs text-white/40">{label}</p>
        <p className="font-semibold">{title}</p>
      </div>
    </div>
  );
}
