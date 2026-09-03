import {
  Bell,
  Command,
  Database,
  LayoutDashboard,
  RotateCcw,
  ScrollText,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";

import Button from "../ui/Button";
import { cn } from "../../lib/utils";

export default function AppLayout({
  children,
  activeTab = "dashboard",
  setActiveTab,
  pendingReviewCount = 0,
  metrics = {},
  isDbConnected = true,
  onTriggerDemo,
  searchQuery = "",
  setSearchQuery,
}) {
  const searchInputRef = useRef(null);
  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "cases", label: "Recovery cases", icon: RotateCcw },
    { id: "reviews", label: "Review queue", icon: ShieldAlert, badge: pendingReviewCount },
    { id: "customers", label: "Customers", icon: Users },
    { id: "audit", label: "Audit log", icon: ScrollText },
  ];

  const currentPage = navItems.find((item) => item.id === activeTab)?.label || "Overview";

  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <div className="grid size-8 place-items-center rounded-lg bg-slate-900 text-white">
            <Sparkles size={16} />
          </div>
          <span className="font-semibold tracking-tight">RecoverAI</span>
        </div>

        <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
          <p className="px-3 pb-2 pt-3 text-xs font-medium uppercase tracking-wider text-slate-500">Workspace</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  selected ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs", selected ? "bg-white/15 text-white" : "bg-rose-100 text-rose-700")}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="m-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Database size={14} className={isDbConnected ? "text-emerald-600" : "text-amber-600"} />
            <span>{isDbConnected ? "Database connected" : "Local demo data"}</span>
          </div>
          <Button variant="glass" size="sm" className="mt-3 w-full justify-center" icon={Zap} onClick={onTriggerDemo}>
            Simulate case
          </Button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-slate-900 text-white md:hidden">
              <Command size={16} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Workspace</p>
              <h1 className="text-sm font-semibold">{currentPage}</h1>
            </div>
          </div>

          <label className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 lg:flex">
            <Search size={14} />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery?.(event.target.value)}
              placeholder="Search cases or customers"
              className="w-44 bg-transparent text-slate-900 outline-none placeholder:text-slate-500"
              aria-label="Search cases or customers"
            />
            <kbd className="ml-8 rounded border bg-white px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </label>

          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <p className="text-slate-500">Revenue at risk</p>
              <p className="font-semibold text-slate-900">₹{Number(metrics.revenue_at_risk || 0).toLocaleString("en-IN")}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className="relative grid size-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Open review queue"
            >
              <Bell size={16} />
              {pendingReviewCount > 0 && (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {pendingReviewCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
