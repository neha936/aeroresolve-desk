import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { escalationApi } from "../services/api";
import GlassCard from "../components/GlassCard";
import ActionButton from "../components/ActionButton";
import EscalationCard from "../components/EscalationCard";
import LoadingScreen from "../components/LoadingScreen";

export default function Escalation() {
  const location = useLocation();
  const navigate = useNavigate();
  const escalationId = location.state?.escalationId;

  const [escalation, setEscalation] = useState(null);
  const [loading, setLoading] = useState(Boolean(escalationId));
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await escalationApi.getById(escalationId);
      setEscalation(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (escalationId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escalationId]);

  if (!escalationId) {
    return (
      <GlassCard className="p-10 text-center">
        <ShieldAlert className="mx-auto mb-3 text-violet-300" size={22} />
        <p className="font-semibold text-white/80">No escalation to show</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-white/45">
          When a request needs supervisor review, raise it from the AI Assistant and it will
          appear here with its status.
        </p>
        <ActionButton className="mx-auto mt-5" onClick={() => navigate("/chat")}>
          Go to AI Assistant
        </ActionButton>
      </GlassCard>
    );
  }

  if (loading) return <LoadingScreen label="Loading escalation" />;

  if (error) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="text-white/70">Unable to load this escalation.</p>
        <p className="mt-1 text-sm text-white/40">{error}</p>
        <ActionButton icon={RefreshCw} variant="secondary" className="mx-auto mt-5" onClick={load}>
          Try Again
        </ActionButton>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Escalation Status</h1>
        <p className="mt-1 text-sm text-white/50">
          Requests beyond standard policy are reviewed by a supervisor.
        </p>
      </div>
      <EscalationCard escalation={escalation} />
    </div>
  );
}
