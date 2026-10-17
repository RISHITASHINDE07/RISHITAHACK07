// Shared civic-domain metadata + demo sample data for JanSuno AI.
// Single source of truth for category / status / priority labels used across pages.

export const CATEGORIES = [
  { key: "garbage", label: "Garbage & Sanitation", labelHi: "कचरा व सफाई", icon: "Trash2", color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" },
  { key: "roads", label: "Roads & Footpaths", labelHi: "सड़क व फुटपाथ", icon: "Construction", color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-200" },
  { key: "water", label: "Water Supply & Leakage", labelHi: "पानी आपूर्ति व रिसाव", icon: "Droplets", color: "text-sky-600", bg: "bg-sky-50", ring: "ring-sky-200" },
  { key: "streetlight", label: "Street Lighting", labelHi: "गली की लाइट", icon: "Lightbulb", color: "text-yellow-600", bg: "bg-yellow-50", ring: "ring-yellow-200" },
  { key: "drainage", label: "Drainage & Sewage", labelHi: "नाली व सीवर", icon: "Waves", color: "text-cyan-600", bg: "bg-cyan-50", ring: "ring-cyan-200" },
  { key: "safety", label: "Public Safety", labelHi: "सार्वजनिक सुरक्षा", icon: "ShieldAlert", color: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-200" },
  { key: "other", label: "Other Civic Issue", labelHi: "अन्य", icon: "CircleDot", color: "text-slate-600", bg: "bg-slate-50", ring: "ring-slate-200" },
];

export const STATUSES = [
  { key: "submitted", label: "Submitted", color: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  { key: "under_review", label: "Under Review", color: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  { key: "community_linked", label: "Community-Linked", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  { key: "action_reported", label: "Action Reported", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  { key: "resolution_evidence_pending", label: "Resolution Evidence Pending", color: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  { key: "resolved_verified", label: "Resolved — Verified", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  { key: "reopened", label: "Reopened", color: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
];

export const PRIORITIES = [
  { key: "low", label: "Low", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { key: "medium", label: "Medium", color: "bg-sky-100 text-sky-700 border-sky-200" },
  { key: "high", label: "High", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "urgent", label: "Urgent", color: "bg-rose-100 text-rose-700 border-rose-200" },
];

export const LANGUAGES = [
  { key: "english", label: "English" },
  { key: "hindi", label: "हिंदी (Hindi)" },
  { key: "hinglish", label: "Hinglish" },
];

export const categoryMeta = (key) => CATEGORIES.find((c) => c.key === key) || CATEGORIES.find((c) => c.key === "other");
export const statusMeta = (key) => STATUSES.find((s) => s.key === key) || STATUSES[0];
export const priorityMeta = (key) => PRIORITIES.find((p) => p.key === key) || PRIORITIES[0];

// Demo seed: a recurring garbage-accumulation scenario in the same locality.
// Clearly fictional — used to demonstrate the end-to-end community-action workflow.
export const SAMPLE_COMPLAINTS = [
  {
    display_id: "JS-2026-0042",
    description: "Har jagah kachra jama ho raha hai last 10 days se. Gali no. 7, Sector 14 ke paas. Bahut badboo aa rahi hai aur bacche bimar pad rahe hain.",
    language: "hinglish",
    category: "garbage",
    ai_summary: "Garbage has been accumulating near Gali No. 7, Sector 14 for approximately 10 days, causing foul smell and reported illness among children.",
    priority: "high",
    locality: "Sector 14, Gali No. 7",
    status: "community_linked",
    affected_people_estimate: 120,
  },
  {
    display_id: "JS-2026-0048",
    description: "Sector 14 area mein kachra uthaya hi nahi ja raha. Do hafte ho gaye. Makaan no. 14 ke saamne dher lag gaya hai.",
    language: "hinglish",
    category: "garbage",
    ai_summary: "Garbage has not been collected in Sector 14 for two weeks; a large pile has formed outside House No. 14.",
    priority: "high",
    locality: "Sector 14, near House No. 14",
    status: "community_linked",
    affected_people_estimate: 90,
  },
  {
    display_id: "JS-2026-0055",
    description: "सेक्टर 14 में कचरा इकट्ठा हो रहा है। पिछले दो हफ्ते से सफाई कर्मचारी नहीं आ रहे। लोगों को तकलीफ हो रही है।",
    language: "hindi",
    category: "garbage",
    ai_summary: "Garbage is accumulating in Sector 14; sanitation workers have not visited for two weeks, causing public inconvenience.",
    priority: "high",
    locality: "Sector 14",
    status: "community_linked",
    affected_people_estimate: 70,
  },
  {
    display_id: "JS-2026-0061",
    description: "Broken streetlight near the park entrance in Sector 22. Completely dark at night, unsafe for women returning from work.",
    language: "english",
    category: "streetlight",
    ai_summary: "A broken streetlight near the Sector 22 park entrance leaves the area dark at night, creating a safety concern.",
    priority: "medium",
    locality: "Sector 22, Park Entrance",
    status: "under_review",
    affected_people_estimate: 40,
  },
];

export const SAMPLE_ISSUES = [
  {
    display_id: "CI-2026-0007",
    title: "Persistent garbage accumulation — Sector 14",
    summary: "Multiple independent residents report uncollected garbage in Sector 14 over a two-week period, with associated odour and health concerns.",
    category: "garbage",
    locality: "Sector 14",
    status: "action_reported",
    report_count: 3,
    confidence: 0.86,
    affected_area: "~2.1 km²",
  },
];

export const SAMPLE_STATS = {
  totalReports: 1284,
  openIssues: 312,
  linkedReports: 198,
  verifiedResolutions: 154,
};
