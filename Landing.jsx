import { Link } from "react-router-dom";
import {
  Megaphone, Users, FileText, ShieldCheck, BarChart3, Sparkles, Plus,
  ArrowRight, MapPin, CheckCircle2, AlertTriangle, Languages, Lock,
} from "lucide-react";
import { SAMPLE_STATS, SAMPLE_COMPLAINTS, SAMPLE_ISSUES, categoryMeta } from "@/lib/civic";
import { StatusBadge } from "@/components/StatusBadge";

const MODULES = [
  { icon: Sparkles, title: "Smart Complaint AI", desc: "Accept complaints in Hindi, English & Hinglish. AI suggests category, summary and priority — and flags personal info before you post.", tone: "text-accent" },
  { icon: Users, title: "Community Issue Detector", desc: "Links duplicate or related reports into one community issue with a confidence score you can correct.", tone: "text-indigo-500" },
  { icon: FileText, title: "Evidence-Based Petition Builder", desc: "Turns confirmed facts into a structured, downloadable petition. Never fabricates signatures or official endorsements.", tone: "text-emerald-500" },
  { icon: ShieldCheck, title: "Trust & Transparency Tracker", desc: "A chronological, auditable timeline. Verified resolution requires evidence and authorized review.", tone: "text-sky-500" },
  { icon: BarChart3, title: "Civic Intelligence Dashboard", desc: "Live stats from real records — totals, open issues, recurring categories — with honest data-quality notes.", tone: "text-amber-500" },
  { icon: Megaphone, title: "JanSuno Action Assistant", desc: "Practical next steps, evidence tips and polite follow-up drafts — you stay in control of every submission.", tone: "text-rose-500" },
];

const STEPS = [
  { n: "1", title: "Report", desc: "A citizen describes the problem and adds a photo." },
  { n: "2", title: "Analyse", desc: "AI proposes category, summary and priority — you confirm." },
  { n: "3", title: "Link", desc: "Related reports are grouped into a community issue." },
  { n: "4", title: "Petition", desc: "Confirmed evidence becomes a structured petition." },
  { n: "5", title: "Verify", desc: "A moderator reviews resolution evidence before marking verified." },
];

export default function Landing() {
  const demoIssue = SAMPLE_ISSUES[0];

  return (
    <div className="animate-fade-up">
      {/* Hero */}
      <section className="relative overflow-hidden navy-gradient text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
                <Languages className="h-3.5 w-3.5 text-accent" /> Hindi · English · Hinglish
              </span>
              <h1 className="mt-5 font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] text-balance">
                One Voice Starts It.<br />
                <span className="text-accent">Community Evidence</span> Drives Change.
              </h1>
              <p className="mt-5 max-w-xl text-base sm:text-lg text-white/75 leading-relaxed">
                JanSuno AI turns scattered civic complaints into organised community evidence,
                actionable petitions and transparent progress — from garbage and roads to water,
                lighting and public safety.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/report" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg teal-glow transition hover:brightness-110">
                  <Plus className="h-5 w-5" /> Report an Issue
                </Link>
                <Link to="/issues" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/15">
                  Explore Community Issues <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-white/55">
                <Lock className="h-3.5 w-3.5" /> Your contact details stay private by default. You consent before anything is public.
              </p>
            </div>

            {/* Demo issue card */}
            <div className="lg:justify-self-end w-full max-w-md">
              <div className="rounded-2xl bg-white/10 p-1.5 ring-1 ring-white/20 backdrop-blur-sm">
                <div className="rounded-xl bg-card text-foreground p-5 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">{demoIssue.display_id}</span>
                    <StatusBadge status={demoIssue.status} />
                  </div>
                  <h3 className="mt-2 font-heading text-lg font-bold">{demoIssue.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{demoIssue.summary}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-700 ring-1 ring-amber-200">
                      {categoryMeta(demoIssue.category).label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-medium">
                      <MapPin className="h-3 w-3" /> {demoIssue.locality}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Stat label="Reports" value={demoIssue.report_count} />
                    <Stat label="Confidence" value={`${Math.round(demoIssue.confidence * 100)}%`} />
                    <Stat label="Area" value={demoIssue.affected_area} />
                  </div>
                  <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Why linked:</span> 3 reports share category “Garbage”, overlapping locality “Sector 14”, and a 2-week timeframe.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BigStat value={SAMPLE_STATS.totalReports.toLocaleString()} label="Total reports" />
          <BigStat value={SAMPLE_STATS.openIssues.toLocaleString()} label="Open issues" />
          <BigStat value={SAMPLE_STATS.linkedReports.toLocaleString()} label="Community-linked reports" />
          <BigStat value={SAMPLE_STATS.verifiedResolutions.toLocaleString()} label="Verified resolutions" />
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-bold">Six connected modules, one workflow</h2>
          <p className="mt-2 text-muted-foreground">Not a complaint box. A civic intelligence platform that connects reports into evidence and action.</p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.title} className="rounded-2xl border border-border bg-card p-6 card-shadow transition hover:shadow-md">
                <span className={`grid h-11 w-11 place-items-center rounded-xl bg-secondary ${m.tone}`}>
                  <Icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold">{m.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <h2 className="font-heading text-3xl font-bold text-center">From complaint to community action</h2>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-card p-5 text-center">
                <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-bold text-white">{s.n}</span>
                <h3 className="mt-3 font-heading font-semibold">{s.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible AI */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-5">
          {[
            { icon: CheckCircle2, title: "AI suggests, you confirm", desc: "Missing info is asked for, never invented. AI suggestions are clearly labelled." },
            { icon: AlertTriangle, title: "No fabricated facts", desc: "No fake signatures, GPS, counts, government links or verification badges." },
            { icon: Lock, title: "Private by default", desc: "Contact details stay private. Consent is required before public posting." },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Icon className="h-5 w-5" /></span>
                <div>
                  <h3 className="font-heading font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="rounded-3xl navy-gradient p-8 sm:p-12 text-center text-white">
          <h2 className="font-heading text-3xl font-bold text-balance">See a problem in your locality? Start the record.</h2>
          <p className="mt-3 text-white/75 max-w-xl mx-auto">One report begins the trail. Community evidence turns it into change.</p>
          <Link to="/report" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg teal-glow transition hover:brightness-110">
            <Plus className="h-5 w-5" /> Report an Issue
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-secondary/60 px-2 py-2.5">
      <div className="font-heading text-lg font-bold text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function BigStat({ value, label }) {
  return (
    <div className="text-center sm:text-left">
      <div className="font-heading text-3xl font-extrabold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
