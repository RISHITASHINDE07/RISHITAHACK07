import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ShieldCheck, Loader2, Flag, RefreshCw, CheckCircle2 } from "lucide-react";
import { StatusBadge, CategoryPill } from "@/components/StatusBadge";
import { CATEGORIES, STATUSES, categoryMeta } from "@/lib/civic";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const STATUS_OPTIONS = STATUSES.filter((s) => s.key !== "submitted");

export default function Admin() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [flags, setFlags] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [busy, setBusy] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (user && user.role !== "admin") { setLoading(false); return; }
    (async () => {
      try {
        const [list, flagList, catAgg, statusAgg] = await Promise.all([
          base44.entities.Complaint.filter({}, { sort: "-created_date", limit: 50, fields: ["display_id", "description", "category", "status", "priority", "locality", "created_date", "created_by"] }),
          base44.entities.Flag.filter({ status: "open" }, { sort: "-created_date", limit: 30 }),
          base44.entities.Complaint.aggregate({ groupBy: "category" }),
          base44.entities.Complaint.aggregate({ groupBy: "status" }),
        ]);
        setComplaints(list.items || []);
        setFlags(flagList.items || []);
        setByCategory((catAgg.rows || []).map((r) => ({ name: (categoryMeta(r.category) || {}).label || r.category, count: r.count })));
        setByStatus((statusAgg.rows || []).map((r) => ({ name: (STATUSES.find((s) => s.key === r.status) || {}).label || r.status, count: r.count })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user, tick]);

  if (!loading && user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 font-heading text-2xl font-bold">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">This dashboard is for authorized moderators. Sign in with an admin account to review reports and record status updates.</p>
      </div>
    );
  }

  const updateStatus = async (cid, status) => {
    setBusy(cid);
    try {
      await base44.functions.invoke("logTimelineEvent", { complaint_id: cid, to_status: status, note: "Status updated by moderator" });
      setTick((t) => t + 1);
    } catch (e) { alert(e.response?.data?.error || e.message); }
    finally { setBusy(null); }
  };

  const reviewFlag = async (fid) => {
    await base44.entities.Flag.update(fid, { status: "reviewed" });
    setTick((t) => t + 1);
  };

  const total = byStatus.reduce((s, r) => s + r.count, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-accent" />
        <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
      </div>
      <p className="mt-1 text-muted-foreground">Moderate reports, record status updates, and review flags. Numbers are computed from live records.</p>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Total reports" value={total} />
            <KPI label="Open flags" value={flags.length} />
            <KPI label="Categories" value={byCategory.length} />
            <KPI label="Distinct statuses" value={byStatus.length} />
          </div>

          <div className="mt-8 grid lg:grid-cols-2 gap-6">
            <ChartCard title="Reports by category">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCategory} margin={{ left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(173 58% 38%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Reports by status">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                    {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">Data-quality note: these figures reflect reports submitted through this demo instance and are not citywide statistics. Small or biased samples should not be read as representative.</p>

          {/* Flags */}
          {flags.length > 0 && (
            <div className="mt-8">
              <h2 className="font-heading text-lg font-semibold flex items-center gap-2"><Flag className="h-4 w-4 text-rose-500" /> Open flags & reopen requests</h2>
              <div className="mt-3 grid gap-2">
                {flags.map((f) => (
                  <div key={f.id} className="rounded-xl border border-border bg-card p-3 flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-rose-600">{f.kind}</span>
                      <p className="text-sm mt-0.5">{f.reason}</p>
                      <Link to={`/complaint/${f.complaint_id}`} className="text-xs text-accent">View complaint →</Link>
                    </div>
                    <button onClick={() => reviewFlag(f.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark reviewed
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complaints table */}
          <div className="mt-8">
            <h2 className="font-heading text-lg font-semibold">Recent reports — status control</h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Locality</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Update to</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-secondary/30">
                      <td className="px-4 py-3"><Link to={`/complaint/${c.id}`} className="font-mono text-xs text-accent hover:underline">{c.display_id}</Link></td>
                      <td className="px-4 py-3"><CategoryPill category={c.category} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{c.locality || "—"}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <select
                          disabled={busy === c.id}
                          defaultValue=""
                          onChange={(e) => { if (e.target.value) updateStatus(c.id, e.target.value); e.target.value = ""; }}
                          className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                        >
                          <option value="" disabled>Choose…</option>
                          {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                        {busy === c.id && <RefreshCw className="inline h-3 w-3 ml-1 animate-spin text-muted-foreground" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Resolving as “Resolved — Verified” requires moderator role and supporting evidence — enforced server-side.</p>
          </div>
        </>
      )}
    </div>
  );
}

const PIE_COLORS = ["hsl(222 47% 30%)", "hsl(173 58% 39%)", "hsl(38 80% 50%)", "hsl(280 55% 55%)", "hsl(142 55% 40%)", "hsl(0 72% 51%)", "hsl(200 60% 50%)"];

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
      <div className="font-heading text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 card-shadow">
      <h3 className="font-heading font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
