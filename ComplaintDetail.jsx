import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  Loader2, ArrowLeft, Sparkles, Flag, RefreshCw, FileText, Copy, CheckCircle2,
  AlertTriangle, ShieldCheck, Clock, MapPin, Link2, X,
} from "lucide-react";
import { StatusBadge, PriorityBadge, CategoryPill } from "@/components/StatusBadge";
import { EvidencePhoto } from "@/components/EvidencePhoto";
import { categoryMeta, statusMeta } from "@/lib/civic";

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [c, setC] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [issue, setIssue] = useState(null);
  const [error, setError] = useState("");
  const [assistant, setAssistant] = useState(null);
  const [loadingAssistant, setLoadingAssistant] = useState(false);
  const [showFlag, setShowFlag] = useState(false);
  const [flagKind, setFlagKind] = useState("flag");
  const [flagReason, setFlagReason] = useState("");
  const [flagBusy, setFlagBusy] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const rec = await base44.entities.Complaint.get(id);
        setC(rec);
        const [tl, iss] = await Promise.all([
          base44.entities.TimelineEvent.filter({ complaint_id: id }, { sort: "created_date", limit: 100 }),
          rec.linked_issue_id ? base44.entities.CommunityIssue.get(rec.linked_issue_id).catch(() => null) : Promise.resolve(null),
        ]);
        setTimeline(tl.items || []);
        setIssue(iss);
      } catch (e) { setError(e.message || "Complaint not found"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const loadAssistant = async () => {
    if (assistant) return;
    setLoadingAssistant(true);
    try {
      const res = await base44.functions.invoke("actionAssistant", {
        category: c.category, context: c.ai_summary || c.description, complaint_id: c.display_id,
      });
      setAssistant(res.data || res);
    } catch (e) { setAssistant({ error: e.message }); }
    finally { setLoadingAssistant(false); }
  };

  const submitFlag = async () => {
    if (!flagReason.trim()) return;
    setFlagBusy(true);
    try {
      await base44.entities.Flag.create({ complaint_id: id, kind: flagKind, reason: flagReason.trim() });
      if (flagKind === "reopen") {
        await base44.functions.invoke("logTimelineEvent", { complaint_id: id, to_status: "reopened", note: flagReason.trim() });
        setC((prev) => ({ ...prev, status: "reopened" }));
        const tl = await base44.entities.TimelineEvent.filter({ complaint_id: id }, { sort: "created_date", limit: 100 });
        setTimeline(tl.items || []);
      }
      setShowFlag(false); setFlagReason("");
    } catch (e) { alert(e.response?.data?.error || e.message); }
    finally { setFlagBusy(false); }
  };

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key); setTimeout(() => setCopied(""), 1500);
  };

  const generatePetition = async () => {
    setLoadingAssistant(true);
    try {
      const res = await base44.functions.invoke("generatePetition", {
        source: {
          title: `${categoryMeta(c.category).label} — ${c.locality || "your locality"}`,
          summary: c.ai_summary || c.description,
          category: c.category,
          locality: c.locality,
          report_count: 1,
          evidence_refs: c.photo_url ? "Photograph submitted by citizen" : "No photograph attached",
          dates: new Date(c.created_date).toLocaleDateString(),
        },
      });
      const draft = res.data || res;
      const year = new Date().getFullYear();
      const cnt = await base44.entities.Petition.count().catch(() => 0);
      const displayId = `PT-${year}-${String(cnt + 1).padStart(4, "0")}`;
      const pet = await base44.entities.Petition.create({
        display_id: displayId,
        title: draft.title, problem_summary: draft.problem_summary, location: draft.location || c.locality,
        dates: draft.dates, evidence_refs: draft.evidence_refs, community_impact: draft.community_impact,
        requested_action: draft.requested_action, source_type: "complaint", source_id: id, status: "draft",
      });
      navigate(`/petition/${pet.id}`);
    } catch (e) { alert(e.response?.data?.error || e.message); }
    finally { setLoadingAssistant(false); }
  };

  if (loading) return <Center><Loader2 className="h-6 w-6 animate-spin text-accent" /></Center>;
  if (error || !c) return <Center><div className="text-center"><AlertTriangle className="mx-auto h-8 w-8 text-amber-500" /><p className="mt-2 text-sm text-muted-foreground">{error || "Not found"}</p><Link to="/dashboard" className="mt-3 inline-block text-accent font-medium">← Back</Link></div></Center>;

  const isOwner = user?.id && c.created_by_id === user.id;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> My reports</Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="font-heading text-2xl font-bold font-mono">{c.display_id}</h1>
        <StatusBadge status={c.status} />
        <PriorityBadge priority={c.priority} />
        <CategoryPill category={c.category} />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.locality || "Locality not specified"}</span>
        {c.location_text && <span>· {c.location_text}</span>}
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(c.created_date).toLocaleString()}</span>
        {c.affected_people_estimate ? <span>· ~{c.affected_people_estimate} affected</span> : null}
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* AI analysis */}
          <Section icon={Sparkles} title="AI analysis" hint={c.ai_confidence != null ? `${Math.round(c.confidence || c.ai_confidence * 100)}% confidence` : ""}>
            <p className="text-sm text-foreground">{c.ai_summary || c.description}</p>
            <div className="mt-3 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Why this category:</span> {c.ai_explanation || "—"}
            </div>
            <div className="mt-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Priority reasoning:</span> {c.priority_reason || "—"}
            </div>
            {c.personal_info_warning && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> {c.personal_info_warning}
              </div>
            )}
          </Section>

          {/* Original description */}
          <Section icon={FileText} title="Original report">
            <p className="text-sm whitespace-pre-wrap text-foreground/90">{c.description}</p>
            {c.photo_url && (
              <div className="mt-3 h-56 w-full overflow-hidden rounded-xl border border-border">
                <EvidencePhoto url={c.photo_url} alt="Evidence" className="h-full w-full" />
              </div>
            )}
          </Section>

          {/* Linked community issue */}
          {issue && (
            <Link to={`/issue/${issue.id}`} className="block rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 hover:bg-indigo-50 transition">
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700"><Link2 className="h-4 w-4" /> Linked to community issue</div>
              <p className="mt-1 font-medium">{issue.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{issue.report_count} reports · {issue.display_id}</p>
            </Link>
          )}

          {/* Action assistant */}
          <Section icon={Sparkles} title="JanSuno Action Assistant">
            {!assistant && !loadingAssistant && (
              <button onClick={loadAssistant} className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4" /> Get practical next steps
              </button>
            )}
            {loadingAssistant && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>}
            {assistant && !assistant.error && (
              <div className="space-y-3 text-sm">
                <AssistantBlock title="Suggested next steps" items={assistant.next_steps} />
                <AssistantBlock title="Evidence that would help" items={assistant.evidence_tips} />
                <CopyBlock label="Polite follow-up message" text={assistant.follow_up_message} onCopy={() => copy(assistant.follow_up_message, "fu")} copied={copied === "fu"} />
                <CopyBlock label="Escalation draft" text={assistant.escalation_draft} onCopy={() => copy(assistant.escalation_draft, "esc")} copied={copied === "esc"} />
                <div className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Why this category:</span> {assistant.category_explanation}</div>
                <p className="text-xs text-muted-foreground">The assistant suggests actions but cannot guarantee any government response and does not provide unverified official contacts.</p>
              </div>
            )}
          </Section>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          <Section icon={Clock} title="Transparency timeline">
            <ol className="relative border-l border-border ml-1.5">
              {timeline.length === 0 && <li className="text-xs text-muted-foreground pl-4">No events yet.</li>}
              {timeline.map((e, i) => {
                const sm = statusMeta(e.to_status);
                return (
                  <li key={e.id || i} className="mb-4 ml-3">
                    <span className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full ${sm.dot} ring-4 ring-card`} />
                    <div className="text-xs text-muted-foreground">{new Date(e.created_date).toLocaleString()}</div>
                    <div className="text-sm font-medium">{sm.label}</div>
                    {e.note && <div className="text-xs text-muted-foreground mt-0.5">{e.note}</div>}
                    <div className="text-[11px] text-muted-foreground mt-0.5">by {e.role || "system"}{e.is_verified ? " · verified" : ""}</div>
                    {e.evidence_url && <div className="mt-1"><EvidencePhoto url={e.evidence_url} alt="Evidence" className="h-16 w-24 rounded" /></div>}
                  </li>
                );
              })}
            </ol>
          </Section>

          <div className="flex flex-col gap-2">
            <button onClick={generatePetition} disabled={loadingAssistant} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              <FileText className="h-4 w-4" /> Generate petition
            </button>
            <button onClick={() => setShowFlag(true)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary">
              <Flag className="h-4 w-4" /> Flag / request reopen
            </button>
          </div>
          <div className="rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="inline h-3.5 w-3.5 mr-1 -mt-0.5 text-accent" />
            Status changes are auditable. “Resolved — Verified” requires a moderator and supporting evidence.
          </div>
        </div>
      </div>

      {/* Flag dialog */}
      {showFlag && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setShowFlag(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-5 card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold">Flag or reopen</h3>
              <button onClick={() => setShowFlag(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setFlagKind("flag")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${flagKind === "flag" ? "border-accent bg-accent/10 text-accent" : "border-border"}`}>Flag incorrect info</button>
              <button onClick={() => setFlagKind("reopen")} className={`rounded-lg border px-3 py-2 text-sm font-medium ${flagKind === "reopen" ? "border-accent bg-accent/10 text-accent" : "border-border"}`}>Request reopen</button>
            </div>
            <textarea value={flagReason} onChange={(e) => setFlagReason(e.target.value)} rows={3} placeholder="Explain what's wrong…"
              className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <button onClick={submitFlag} disabled={flagBusy || !flagReason.trim()} className="mt-3 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {flagBusy ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, hint, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-accent" /> {title}</div>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function AssistantBlock({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1">{title}</div>
      <ul className="list-disc pl-5 space-y-1 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

function CopyBlock({ label, text, onCopy, copied }) {
  if (!text) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <button onClick={onCopy} className="inline-flex items-center gap-1 text-xs text-accent">{copied ? <><CheckCircle2 className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}</button>
      </div>
      <div className="rounded-lg bg-secondary/60 p-3 text-sm whitespace-pre-wrap">{text}</div>
    </div>
  );
}

function Center({ children }) { return <div className="mx-auto max-w-4xl px-4 py-20 flex items-center justify-center">{children}</div>; }
