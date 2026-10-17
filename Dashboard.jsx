import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Plus, FileText, Users, CheckCircle2, AlertCircle, Loader2, Inbox } from "lucide-react";
import { StatusBadge, PriorityBadge, CategoryPill } from "@/components/StatusBadge";
import { categoryMeta } from "@/lib/civic";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, linked: 0, resolved: 0 });

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [listRes, agg] = await Promise.all([
          base44.entities.Complaint.filter(
            { created_by_id: user.id },
            { sort: "-created_date", limit: 50, fields: ["display_id", "description", "category", "priority", "status", "locality", "linked_issue_id", "ai_summary", "created_date"] }
          ),
          base44.entities.Complaint.aggregate({ query: { created_by_id: user.id }, groupBy: "status" }),
        ]);
        setComplaints(listRes.items || []);
        const rows = agg.rows || [];
        const byStatus = {};
        rows.forEach((r) => (byStatus[r.status] = r.count));
        setStats({
          total: rows.reduce((s, r) => s + r.count, 0),
          open: (byStatus.submitted || 0) + (byStatus.under_review || 0) + (byStatus.community_linked || 0) + (byStatus.action_reported || 0) + (byStatus.resolution_evidence_pending || 0) + (byStatus.reopened || 0),
          linked: byStatus.community_linked || 0,
          resolved: byStatus.resolved_verified || 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">My Reports</h1>
          <p className="mt-1 text-muted-foreground">Track your complaints, their AI analysis, and community links.</p>
        </div>
        <Link to="/report" className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110">
          <Plus className="h-4 w-4" /> Report an Issue
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total reports" value={stats.total} tone="text-foreground" />
        <StatCard icon={AlertCircle} label="Open" value={stats.open} tone="text-amber-600" />
        <StatCard icon={Users} label="Community-linked" value={stats.linked} tone="text-indigo-600" />
        <StatCard icon={CheckCircle2} label="Verified resolved" value={stats.resolved} tone="text-emerald-600" />
      </div>

      <div className="mt-8">
        <h2 className="font-heading text-lg font-semibold mb-3">Recent reports</h2>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…</div>
        ) : complaints.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3">
            {complaints.map((c) => (
              <Link key={c.id} to={`/complaint/${c.id}`} className="group rounded-2xl border border-border bg-card p-4 card-shadow transition hover:shadow-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{c.display_id}</span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                  <CategoryPill category={c.category} />
                </div>
                <p className="mt-2 text-sm text-foreground line-clamp-2">{c.ai_summary || c.description}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{c.locality || "Locality not specified"}</span>
                  <span className="text-accent font-medium opacity-0 group-hover:opacity-100 transition">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 card-shadow">
      <Icon className={`h-5 w-5 ${tone}`} />
      <div className="mt-2 font-heading text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
      <Inbox className="mx-auto h-10 w-10 text-muted-foreground/50" />
      <h3 className="mt-3 font-heading font-semibold">No reports yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">When you report an issue, it will appear here with its AI analysis and status timeline.</p>
      <Link to="/report" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white">
        <Plus className="h-4 w-4" /> Report your first issue
      </Link>
    </div>
  );
}
