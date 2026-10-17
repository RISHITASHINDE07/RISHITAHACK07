import { statusMeta, priorityMeta, categoryMeta } from "@/lib/civic";

export function StatusBadge({ status, className = "" }) {
  const s = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.color} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function PriorityBadge({ priority, className = "" }) {
  const p = priorityMeta(priority);
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${p.color} ${className}`}>
      {p.label} priority
    </span>
  );
}

export function CategoryPill({ category, className = "" }) {
  const c = categoryMeta(category);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md ${c.bg} ${c.color} px-2 py-0.5 text-xs font-medium ring-1 ${c.ring} ${className}`}>
      {c.label}
    </span>
  );
}
