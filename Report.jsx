import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Sparkles, Loader2, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Upload, Link2, ShieldCheck, Info } from "lucide-react";
import { CATEGORIES, PRIORITIES, LANGUAGES, categoryMeta } from "@/lib/civic";
import { CategoryPill, PriorityBadge } from "@/components/StatusBadge";

export default function Report() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ description: "", language: "hinglish", locality: "", location_text: "", affected_people_estimate: "", is_public: false });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [edit, setEdit] = useState({ category: "", priority: "", summary: "" });
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [finding, setFinding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
    setError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const analyze = async () => {
    if (form.description.trim().length < 10) { setError("Please describe the issue in at least a sentence."); return; }
    setError(""); setAnalyzing(true);
    try {
      const res = await base44.functions.invoke("analyzeComplaint", {
        description: form.description, language: form.language,
        affected_people_estimate: Number(form.affected_people_estimate) || 0,
      });
      const data = res.data || res;
      setAnalysis(data);
      setEdit({ category: data.category, priority: data.priority, summary: data.summary });
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Analysis failed. Please try again.");
    } finally { setAnalyzing(false); }
  };

  const findRelated = async () => {
    setFinding(true); setError("");
    try {
      const res = await base44.functions.invoke("findRelatedComplaints", {
        description: form.description, category: edit.category, locality: form.locality,
      });
      setMatches((res.data || res).matches || []);
      setStep(3);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setFinding(false); }
  };

  const submit = async (link) => {
    setSubmitting(true); setError("");
    try {
      const year = new Date().getFullYear();
      const cnt = await base44.entities.Complaint.count().catch(() => 0);
      const displayId = `JS-${year}-${String(cnt + 1).padStart(4, "0")}`;

      let photoUri = null;
      if (photoFile) {
        const up = await base44.integrations.Core.UploadPrivateFile({ file: photoFile });
        photoUri = up.file_uri;
      }

      const created = await base44.entities.Complaint.create({
        display_id: displayId,
        description: form.description.trim(),
        language: form.language,
        category: edit.category,
        ai_summary: edit.summary,
        priority: edit.priority,
        priority_reason: analysis.priority_reason,
        locality: form.locality.trim(),
        location_text: form.location_text.trim(),
        status: "submitted",
        photo_url: photoUri,
        is_public: !!form.is_public,
        ai_confidence: analysis.confidence,
        ai_explanation: analysis.explanation,
        personal_info_warning: analysis.personal_info_warning || "",
        affected_people_estimate: Number(form.affected_people_estimate) || 0,
      });

      await base44.functions.invoke("logTimelineEvent", {
        complaint_id: created.id, to_status: "submitted", note: "Complaint submitted by citizen",
      });

      if (link && selected.size > 0) {
        const catLabel = categoryMeta(edit.category).label;
        const issueTitle = `${catLabel} reports — ${form.locality || "Locality"}`;
        const res = await base44.functions.invoke("linkComplaints", {
          complaint_ids: [created.id, ...Array.from(selected)],
          title: issueTitle,
          summary: edit.summary,
          category: edit.category,
          locality: form.locality,
          confidence: matches[0]?.score || 0.7,
        });
        const issue = (res.data || res).issue;
        if (issue) { navigate(`/issue/${issue.id}`); return; }
      }
      navigate(`/complaint/${created.id}`);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Submission failed.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-accent" />
        <h1 className="font-heading text-3xl font-bold">Report an Issue</h1>
      </div>
      <p className="mt-1 text-muted-foreground">Describe the problem in Hindi, English or Hinglish. AI suggests a category and priority — you confirm everything.</p>

      <Stepper step={step} />

      {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertTriangle className="inline h-4 w-4 mr-1.5 -mt-0.5" />{error}</div>}

      {/* Step 1: Describe */}
      {step === 1 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 card-shadow space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Describe the issue *</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5}
              placeholder="e.g. Har jagah kachra jama ho raha hai last 10 days se. Gali no. 7, Sector 14 ke paas…"
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Language</label>
              <select value={form.language} onChange={(e) => set("language", e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
                {LANGUAGES.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Locality / landmark</label>
              <input value={form.locality} onChange={(e) => set("locality", e.target.value)} placeholder="Sector 14, Gali No. 7"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Specific location detail (optional)</label>
              <input value={form.location_text} onChange={(e) => set("location_text", e.target.value)} placeholder="Near House No. 14"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">People affected (approx.)</label>
              <input type="number" min="0" value={form.affected_people_estimate} onChange={(e) => set("affected_people_estimate", e.target.value)} placeholder="e.g. 50"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Evidence photo (optional, stored privately)</label>
            <label className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-secondary/40 p-3 cursor-pointer hover:bg-secondary">
              <Upload className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">{photoFile ? photoFile.name : "Click to upload an image (max 5 MB)"}</span>
              <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            </label>
            {photoPreview && <img src={photoPreview} alt="preview" className="mt-2 h-32 w-full object-cover rounded-lg" />}
          </div>
          <label className="flex items-start gap-2.5 rounded-xl bg-secondary/50 p-3 cursor-pointer">
            <input type="checkbox" checked={form.is_public} onChange={(e) => set("is_public", e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-teal-600" />
            <span className="text-sm text-muted-foreground">I consent to this report (description, locality and photo) being visible to other residents as community evidence. My contact details stay private.</span>
          </label>
          <button onClick={analyze} disabled={analyzing} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60">
            {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> AI is analysing…</> : <><Sparkles className="h-4 w-4" /> Analyse with AI</>}
          </button>
        </div>
      )}

      {/* Step 2: AI review */}
      {step === 2 && analysis && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Sparkles className="h-4 w-4" /> AI suggestion <span className="text-xs font-normal text-muted-foreground">· {analysis.source === "ai" ? "language model" : "rule-based fallback"}</span>
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Category (editable)</label>
                <select value={edit.category} onChange={(e) => setEdit((s) => ({ ...s, category: e.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Priority (editable)</label>
                <select value={edit.priority} onChange={(e) => setEdit((s) => ({ ...s, priority: e.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
                  {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Summary (editable)</label>
              <textarea value={edit.summary} onChange={(e) => setEdit((s) => ({ ...s, summary: e.target.value }))} rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="mt-3 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Why this category:</span> {analysis.explanation}
              <span className="ml-2">· Confidence: <span className="font-semibold text-foreground">{Math.round((analysis.confidence || 0) * 100)}%</span></span>
            </div>
            <div className="mt-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Why this priority:</span> {analysis.priority_reason}
            </div>
            {analysis.personal_info_warning && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> {analysis.personal_info_warning}
              </div>
            )}
            {Array.isArray(analysis.missing_info) && analysis.missing_info.length > 0 && (
              <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
                <Info className="inline h-3.5 w-3.5 mr-1 -mt-0.5" /> Consider adding: {analysis.missing_info.join(", ")}.
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setStep(1)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={findRelated} disabled={finding} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {finding ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching for related reports…</> : <><Link2 className="h-4 w-4" /> Find related reports</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Link & submit */}
      {step === 3 && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
            <div className="flex items-center gap-2 text-sm font-semibold"><Link2 className="h-4 w-4 text-accent" /> Potentially related reports</div>
            <p className="mt-1 text-xs text-muted-foreground">These are suggestions, not verified duplicates. Select the ones that describe the same issue — they'll be grouped into a community issue with you.</p>
            {matches.length === 0 ? (
              <div className="mt-3 rounded-lg bg-secondary/60 p-4 text-sm text-muted-foreground">No related reports found. Yours will be the first report for this issue.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {matches.map((m) => {
                  const on = selected.has(m.id);
                  return (
                    <label key={m.id} className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${on ? "border-accent bg-accent/5" : "border-border bg-background hover:bg-secondary/40"}`}>
                      <input type="checkbox" checked={on} onChange={() => {
                        setSelected((prev) => { const n = new Set(prev); n.has(m.id) ? n.delete(m.id) : n.add(m.id); return n; });
                      }} className="mt-0.5 h-4 w-4 rounded accent-teal-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{m.display_id}</span>
                          <CategoryPill category={m.category} />
                          <span className="text-xs text-muted-foreground">{Math.round(m.score * 100)}% match</span>
                        </div>
                        <p className="mt-1 text-sm line-clamp-2">{m.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Why:</span> {m.explanation}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setStep(2)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={() => submit(false)} disabled={submitting} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Submit only
            </button>
            <button onClick={() => submit(true)} disabled={submitting || selected.size === 0} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {selected.size > 0 ? `Submit & link ${selected.size + 1} reports` : "Select reports to link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }) {
  const labels = ["Describe", "AI review", "Link & submit"];
  return (
    <div className="mt-6 flex items-center gap-2">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={l} className="flex items-center gap-2 flex-1">
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${active ? "bg-accent text-white" : done ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"}`}>{done ? "✓" : n}</span>
            <span className={`text-xs font-medium ${active || done ? "text-foreground" : "text-muted-foreground"}`}>{l}</span>
            {i < 2 && <span className="flex-1 h-px bg-border mx-1" />}
          </div>
        );
      })}
    </div>
  );
}
