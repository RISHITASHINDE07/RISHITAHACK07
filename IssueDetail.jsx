import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Loader2, ArrowLeft, Users, FileText, MapPin, AlertTriangle, Link2,
  CheckCircle2, ShieldCheck, X, Flag,
} from "lucide-react";
import { StatusBadge, CategoryPill } from "@/components/StatusBadge";
import { EvidencePhoto } from "@/components/EvidencePhoto";

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [correction, setCorrection] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const iss = await base44.entities.CommunityIssue.get(id);
        setIssue(iss);
        const rel = await base44.entities.Complaint.filter({ linked_issue_id: id }, { sort: "-created_date", limit: 50 });
        setReports(rel.items || []);
      } catch (e) { setError(e.message || "Issue not found"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const generatePetition = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke("generatePetition", {
        source: {
          title: issue.title,
          summary: issue.summary,
          category: issue.category,
          locality: issue.locality,
          report_count: issue.report_count || reports.length,
          evidence_refs: `${reports.length} citizen reports${reports.some((r) => r.photo_url) ? " with photographs" : ""}`,
          dates: "Over the reported period",
        },
      });
      const draft = res.data || res;
      const year = new Date().getFullYear();
      const cnt = await base44.entities.Petition.count().catch(() => 0);
      const displayId = `PT-${year}-${String(cnt + 1).padStart(4, "0")}`;
      const pet = await base44.entities.Petition.create({
        display_id: displayId,
        title: draft.title, problem_summary: draft.problem_summary, location: draft.location || issue.locality,
        dates: draft.dates, evidence_refs: draft.evidence_refs, community_impact: draft.community_impact,
        requested_action: draft.requested_action, source_type: "community_issue", source_id: id, status: "draft",
      });
      navigate(`/petition/${pet.id}`);
    } catch (e) { alert(e.response?.data?.error || e.message); }
    finally { setGenerating(false); }
  };

  const submitCorrection = async () => {
    if (!correction.trim() || reports.length === 0) return;
    setBusy(true);
    try {
      await base44.entities.Flag.create({
        complaint_id: reports[0].id, kind: "flag",
        reason: `Community issue ${issue.display_id} — possible incorrect grouping: ${correction.trim()}`,
      });
      setShowCorrect(false); setCorrection("");
    } catch (e) { alert(e.response?.data?.error || e.message); }
    finally { setBusy(false); }
  };

  if (loading) return <Center><Loader2 className="h-6 w-6 animate-spin text-accent" /></Center>;
  if (error || !issue) return <Center><div className="text-center"><AlertTriangle className="mx-auto h-8 w-8 text-amber-500" /><p className="mt-2 text-sm text-muted-foreground">{error || "Not found"}</p><Link to="/issues" className="mt-3 inline-block text-accent font-medium">← Back</Link></div></Center>;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Link to="/issues" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Community issues</Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="font-heading text-2xl font-bold">{issue.title}</h1>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{issue.display_id}</span>
        <StatusBadge status={issue.status} />
        <CategoryPill category={issue.category} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {issue.locality || "—"}</span>
      </div>
      <p className="mt-3 text-sm text-foreground/90">{issue.summary}</p>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Independent reports" value={issue.report_count} />
        <Stat label="Match confidence" value={issue.confidence ? `${Math.round(issue.confidence * 100)}%` : "—"} />
        <Stat label="Affected area" value={issue.affected_area || "—"} />
        <Stat label="Reports shown" value={reports.length} />
      </div>

      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-sm text-indigo-900">
        <span className="font-semibold inline-flex items-center gap-1.5"><Link2 className="h-4 w-4" /> Why these reports were linked:</span>
        <p className="mt-1 text-indigo-800/80">{issue.match_explanation || "Reports grouped by category, locality and textual similarity."}</p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button onClick={generatePetition} disabled={generating} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Generate evidence-based petition
        </button>
        <button onClick={() => setShowCorrect(true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary">
          <Flag className="h-4 w-4" /> Suggest correction
        </button>
      </div>

      <div className="mt-8">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Combined evidence ({reports.length})</h2>
        <p className="mt-1 text-xs text-muted-foreground">Individual reports linked to this community issue. Only reports shared as public evidence are shown to all viewers.</p>
        {reports.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">No linked reports are visible to you.</div>
        ) : (
          <div className="mt-3 grid gap-3">
            {reports.map((r) => (
              <Link key={r.id} to={`/complaint/${r.id}`} className="flex gap-4 rounded-2xl border border-border bg-card p-4 card-shadow hover:shadow-md transition">
                {r.photo_url ? (
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-border">
                    <EvidencePhoto url={r.photo_url} alt="Evidence" className="h-full w-full" />
                  </div>
                ) : (
                  <div className="grid h-20 w-28 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground"><Users className="h-6 w-6" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{r.display_id}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm line-clamp-2">{r.ai_summary || r.description}</p>
                  <div className="mt-1 text-xs text-muted-foreground">{r.locality || "—"} · {new Date(r.created_date).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="inline h-3.5 w-3.5 mr-1 -mt-0.5 text-accent" />
        Confidence reflects textual, category and locality similarity — not verified duplication. Independent reports strengthen evidence; duplicate reports are not counted as independent verification.
      </div>

      {showCorrect && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setShowCorrect(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-5 card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold">Suggest a correction</h3>
              <button onClick={() => setShowCorrect(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">If these reports were grouped incorrectly, a moderator will review your note.</p>
            <textarea value={correction} onChange={(e) => setCorrection(e.target.value)} rows={3} placeholder="Which report doesn't belong, and why?"
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={submitCorrection} disabled={busy || !correction.trim()} className="mt-3 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? "Submitting…" : "Submit correction"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 card-shadow">
      <div className="font-heading text-xl font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function Center({ children }) { return <div className="mx-auto max-w-4xl px-4 py-20 flex items-center justify-center">{children}</div>; }
