import {
  Search,
  Zap,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

export default function AppLayout({
  children,
  activeTab = "dashboard",
  setActiveTab,
  pendingReviewCount = 0,
  metrics = {},
  isDbConnected = true,
  onTriggerDemo,
  onResetDemo,
  searchQuery = "",
  setSearchQuery,
  currentUser = null,
  onLogout,
}) {
  const searchInputRef = useRef(null);

  const navItems = [
    { id: "dashboard", label: "OVERVIEW" },
    { id: "recovery", label: "RECOVERY" },
    { id: "cases", label: "CASES", badge: 369 },
    { id: "intelligence", label: "INTELLIGENCE" },
  ];

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

  const handleNavClick = (id) => {
    if (id === "recovery") {
      // If on dashboard, smooth scroll to pipeline/queue, or switch tab
      setActiveTab("dashboard");
      const element = document.getElementById("recovery-pipeline-section") || document.getElementById("recovery-queue-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else if (id === "intelligence") {
      setActiveTab("dashboard");
      const element = document.getElementById("ai-intelligence-section") || document.getElementById("recovery-safety-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      setActiveTab(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f3f1] text-[#242424] font-mono selection:bg-[#cfdaf5] selection:text-[#242424]">
      {/* =====================================================
          1. TOP NAVIGATION (Monad Minimal Editorial Header)
          ===================================================== */}
      <header className="sticky top-0 z-40 bg-[#f6f3f1]/90 backdrop-blur-md border-b border-[#cecac8]">
        <div className="mx-auto flex h-20 max-w-[1432px] items-center justify-between px-6 sm:px-10">
          
          {/* LEFT: WORDMARK */}
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3 cursor-pointer group text-left"
          >
            <span className="size-2.5 rounded-full bg-[#242424] group-hover:bg-[#2b59d1] transition-colors" />
            <span className="font-serif text-2xl tracking-tight text-[#242424]">
              RecoverAI
            </span>
          </button>

          {/* CENTER: MINIMAL MONOSPACE NAVIGATION */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navItems.map((item) => {
              const isSelected = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "text-xs tracking-wider uppercase transition-colors cursor-pointer relative py-1",
                    isSelected
                      ? "text-[#242424] font-medium"
                      : "text-[#797776] hover:text-[#242424]"
                  )}
                >
                  <span>{item.label}</span>
                  {isSelected && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[1px] bg-[#242424]" />
                  )}
                  {item.badge !== undefined && item.badge !== null && (
                    <span className="ml-1.5 rounded-full bg-[#fae8e0] px-1.5 py-0.5 text-[10px] font-mono text-[#c2410c] border border-[#f9cbba]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* RIGHT: SEARCH + STATUS PILL */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Minimal Search Pill */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-[#cecac8] bg-[#f6f3f1] px-3.5 py-1.5 text-xs text-[#797776]">
              <Search size={13} className="text-[#797776]" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery?.(e.target.value)}
                placeholder="SEARCH CASES..."
                className="w-28 bg-transparent text-[#242424] placeholder:text-[#797776] outline-none text-[11px] font-mono tracking-wider uppercase"
                aria-label="Search cases"
              />
              <kbd className="rounded border border-[#cecac8] px-1 py-0.2 text-[9px] text-[#797776]">⌘K</kbd>
            </div>

            {/* System Status Pill */}
            <div className="flex items-center gap-2.5 rounded-full border border-[#cecac8] bg-[#f6f3f1] px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[#242424]">
              <span className="size-2 rounded-full bg-[#059669] radar-ping" />
              <span>
                Autonomous Mode: <strong className="font-normal text-[#242424]">Active</strong>
              </span>
            </div>

            {/* Test Simulation trigger */}
            <button
              type="button"
              onClick={onTriggerDemo}
              title="Simulate high-risk incoming payment failure"
              className="p-2 rounded-full border border-[#cecac8] text-[#4e4d4d] hover:text-[#242424] hover:border-[#242424] transition-colors cursor-pointer"
            >
              <Zap size={14} />
            </button>

            {/* Reset Demo State */}
            {onResetDemo && (
              <button
                type="button"
                onClick={onResetDemo}
                title="Reset Demo Data (Re-seed 16 test transactions)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#cecac8] hover:border-[#242424] text-[#4e4d4d] hover:text-[#242424] transition-colors text-[11px] font-mono uppercase tracking-wider cursor-pointer bg-[#f6f3f1]"
              >
                <RotateCcw size={12} />
                <span className="hidden sm:inline">RESET DEMO</span>
              </button>
            )}

            {/* User Session & Logout */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#cecac8] bg-[#f6f3f1] px-3 py-1.5 text-[11px] font-mono text-[#242424]">
                <span className="size-5 rounded-full bg-[#2b59d1] text-white flex items-center justify-center text-[9px] font-bold">
                  {currentUser.avatar || "OP"}
                </span>
                <span className="truncate max-w-[110px] font-medium">{currentUser.name || "Operator"}</span>
              </div>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign out of RecoverAI"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#cecac8] hover:border-[#242424] text-[#4e4d4d] hover:text-[#242424] transition-colors text-[11px] font-mono uppercase tracking-wider cursor-pointer bg-[#f6f3f1]"
              >
                <LogOut size={12} />
                <span className="hidden md:inline">LOGOUT</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around border-t border-[#cecac8] px-4 py-2.5 text-xs bg-[#f6f3f1]">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "text-[11px] tracking-wider uppercase",
                activeTab === item.id ? "text-[#242424] font-medium" : "text-[#797776]"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* =====================================================
          MAIN VIEWPORT CONTAINER (Max-width 1432px)
          ===================================================== */}
      <main className="mx-auto w-full max-w-[1432px] px-6 sm:px-10 pt-6 pb-16 md:pt-8 md:pb-20">
        {children}
      </main>
    </div>
  );
}
