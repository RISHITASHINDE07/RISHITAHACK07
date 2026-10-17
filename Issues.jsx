import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Users, Loader2, MapPin, Search, Filter, Inbox } from "lucide-react";
import { StatusBadge, CategoryPill } from "@/components/StatusBadge";
import { CATEGORIES, STATUSES, categoryMeta } from "@/lib/civic";

export default function Issues() {
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const query = {};
        if (category !== "all") query.category = category;
        if (status !== "all") query.status = status;
        if (q.trim()) query.title = { $regex: q.trim(), $options: "i" };
        const res = await base44.entities.CommunityIssue.filter(query, { sort: "-created_date", limit: 50 });
        setIssues(res.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [category, status, q]);

  const byLocality = useMemo(() => {
    const map = {};
    issues.forEach((i) => {
      const key = i.locality || "Unspecified locality";
      (map[key] = map[key] || []).push(i);
    });
    return Object.entries(map);
  }, [issues]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Community Issues</h1>
        <p className="mt-1 text-muted-foreground">Related reports grouped into shared community issues — with explainable matching.</p>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search issue titles…"
            className="w-full rounded-xl border border-input bg-card pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
      ) : issues.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-3 font-heading font-semibold">No community issues match your filters</h3>
          <p className="mt-1 text-sm text-muted-foreground">New issues appear here when related reports are linked together.</p>
        </div>
      ) : (
        <>
          {/* Location explorer */}
          <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="h-4 w-4 text-accent" /> Location explorer
              <span className="text-xs font-normal text-muted-foreground">· grouped by locality (no live map configured)</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {byLocality.map(([loc, list]) => (
                <span key={loc} className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1 text-xs">
                  <MapPin className="h-3 w-3 text-muted-foreground" /> {loc} <span className="text-muted-foreground">· {list.length}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((i) => (
              <Link key={i.id} to={`/issue/${i.id}`} className="group rounded-2xl border border-border bg-card p-5 card-shadow transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{i.display_id}</span>
                  <StatusBadge status={i.status} />
                </div>
                <h3 className="mt-2 font-heading text-base font-semibold leading-snug line-clamp-2">{i.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{i.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <CategoryPill category={i.category} />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {i.locality || "—"}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Mini label="Reports" value={i.report_count} />
                  <Mini label="Confidence" value={i.confidence ? `${Math.round(i.confidence * 100)}%` : "—"} />
                  <Mini label="Area" value={i.affected_area || "—"} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-lg bg-secondary/60 px-2 py-1.5">
      <div className="font-heading text-sm font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
