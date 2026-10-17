import { Link, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Megaphone, LayoutDashboard, Users, ShieldCheck, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const NAV = [
  { to: "/", label: "Home", icon: Megaphone, end: true },
  { to: "/dashboard", label: "My Reports", icon: LayoutDashboard },
  { to: "/issues", label: "Community Issues", icon: Users },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  const navItems = [...NAV, ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }] : [])];

  const isActive = (to, end) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="grid h-9 w-9 place-items-center rounded-xl navy-gradient text-white shadow-sm">
                <Megaphone className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-heading text-[15px] font-extrabold tracking-tight text-foreground">JanSuno<span className="text-accent"> AI</span></span>
                <span className="text-[10px] font-medium text-muted-foreground">Community Evidence → Change</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to, item.end);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/report"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:brightness-110"
              >
                <Plus className="h-4 w-4" /> Report an Issue
              </Link>
              <button
                onClick={() => setOpen((v) => !v)}
                className="md:hidden grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground"
                aria-label="Toggle menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to, item.end);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active ? "bg-secondary text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                );
              })}
              <Link to="/report" onClick={() => setOpen(false)} className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 py-2.5 text-sm font-semibold text-accent-foreground">
                <Plus className="h-4 w-4" /> Report an Issue
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>JanSuno AI — demo build. Sample data is fictional and does not represent real citizens or government action.</p>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">{user?.email}</span>
            <button onClick={() => logout()} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-secondary text-foreground">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
