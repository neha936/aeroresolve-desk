import { Ticket } from "lucide-react";
import GlassCard from "./GlassCard";
import StatusBadge from "./StatusBadge";
import FlightPath from "./FlightPath";

function formatTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function BookingCard({ booking }) {
  if (!booking) return null;
  const { flight } = booking;

  return (
    <GlassCard tilt glow className="overflow-hidden p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-cyan-300">
            <Ticket size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/40">PNR</p>
            <p className="text-xl font-bold tracking-tight">{booking.pnr}</p>
          </div>
        </div>
        <StatusBadge status={flight?.status} label={`Flight ${flight?.status}`} />
      </div>

      <div className="mt-8">
        <p className="text-3xl font-extrabold tracking-tight text-gradient sm:text-4xl">
          {flight?.origin} → {flight?.destination}
        </p>
        <p className="mt-1 text-sm text-white/50">Flight {flight?.flightNumber}</p>
      </div>

      <div className="mt-8">
        <FlightPath origin={flight?.origin} destination={flight?.destination} status={flight?.status} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 sm:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">Departure</p>
          <p className="mt-1 font-semibold">{formatTime(flight?.departureTime)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">Arrival</p>
          <p className="mt-1 font-semibold">{formatTime(flight?.arrivalTime)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">Fare Class</p>
          <p className="mt-1 font-semibold capitalize">{booking.fareClass}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">Booking</p>
          <p className="mt-1 font-semibold capitalize">{booking.status}</p>
        </div>
      </div>
    </GlassCard>
  );
}
