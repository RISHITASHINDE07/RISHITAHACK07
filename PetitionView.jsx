import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Save, Printer, CheckCircle2, ArrowLeft, FileText, AlertTriangle, Copy } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";

export default function PetitionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const rec = await base44.entities.Petition.get(id);
        setP(rec);
      } catch (e) {
        setError(e.message || "Petition not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (k, v) => setP((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Petition.update(id, {
        title: p.title, problem_summary: p.problem_summary, location: p.location,
        dates: p.dates, evidence_refs: p.evidence_refs, community_impact: p.community_impact,
        requested_action: p.requested_action, status: p.status === "draft" ? "draft" : p.status,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.Petition.update(id, { ...p, status: "approved" });
      setP(updated);
    } finally { setSaving(false); }
  };

  const markExported = async () => {
    const updated = await base44.entities.Petition.update(id, { status: "exported" });
    setP(updated);
    window.print();
  };

  if (loading) return <Center><Loader2 className="h-6 w-6 animate-spin text-accent" /></Center>;
  if (error || !p) return <Center><div className="text-center"><AlertTriangle className="mx-auto h-8 w-8 text-amber-500" /><p className="mt-2 text-sm text-muted-foreground">{error || "Not found"}</p><Link to="/issues" className="mt-3 inline-block text-accent font-medium">← Back</Link></div></Center>;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between print:hidden">
        <Link to={p.source_type === "community_issue" ? "/issues" : "/dashboard"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <StatusBadge status={p.source_type === "complaint" ? "community_linked" : "community_linked"} className="hidden" />
        <span className="text-xs font-medium text-muted-foreground capitalize">{p.status}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 print:hidden">
        <FileText className="h-5 w-5 text-accent" />
        <h1 className="font-heading text-2xl font-bold">Petition Builder</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground print:hidden">Edit every field. This is a draft you control — nothing is submitted to any authority from this app.</p>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 print:hidden">
        <AlertTriangle className="inline h-4 w-4 mr-1.5 -mt-0.5" />
        This petition is <strong>not officially submitted</strong>. JanSuno AI never fabricates signatures, government references, or endorsements. Export a copy to deliver through your own authorised channel.
      </div>

      {/* Editable petition document */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8 card-shadow print:border-0 print:shadow-none print:p-0">
        <div className="text-center border-b border-border pb-4 print:border-black">
          <div className="font-heading text-xs font-semibold tracking-widest text-accent uppercase">JanSuno AI — Citizen Petition</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-1">{p.display_id} · {p.source_type === "community_issue" ? "From community issue" : "From complaint"}</div>
        </div>

        <Field label="Title" value={p.title} onChange={(v) => set("title", v)} />
        <Field label="Problem summary" value={p.problem_summary} onChange={(v) => set("problem_summary", v)} rows={3} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Location" value={p.location} onChange={(v) => set("location", v)} />
          <Field label="Dates / duration" value={p.dates} onChange={(v) => set("dates", v)} />
        </div>
        <Field label="Evidence references" value={p.evidence_refs} onChange={(v) => set("evidence_refs", v)} rows={2} />
        <Field label="Community impact" value={p.community_impact} onChange={(v) => set("community_impact", v)} rows={2} />
        <Field label="Requested action" value={p.requested_action} onChange={(v) => set("requested_action", v)} rows={2} />
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save draft"}
        </button>
        <button onClick={approve} disabled={saving || p.status === "approved"} className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <CheckCircle2 className="h-4 w-4" /> Approve
        </button>
        <button onClick={markExported} className="inline-flex items-center gap-1.5 rounded-xl navy-gradient px-4 py-2.5 text-sm font-semibold text-white">
          <Printer className="h-4 w-4" /> Print / Export
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, rows = 1 }) {
  return (
    <div className="mt-4">
      <label className="block text-xs font-semibold text-muted-foreground mb-1">{label}</label>
      {rows > 1 ? (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={rows}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring print:border-0 print:p-0 print:text-[13px]" />
      ) : (
        <input value={value || ""} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring print:border-0 print:p-0 print:text-[13px]" />
      )}
    </div>
  );
}

function Center({ children }) {
  return <div className="mx-auto max-w-3xl px-4 py-20 flex items-center justify-center">{children}</div>;
}
