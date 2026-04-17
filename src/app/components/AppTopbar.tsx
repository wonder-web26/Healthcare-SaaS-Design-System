import React, { useState } from "react";
import { Search, Plus, Bell, ChevronDown, X, Command } from "lucide-react";

export function AppTopbar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
      {/* ── Global Search ────────────────── */}
      <div className={`relative flex-1 max-w-[480px] transition-all duration-200 ${searchFocused ? "max-w-[560px]" : ""}`}>
        <div
          className={`
            flex items-center gap-2 px-3 py-[7px] rounded-xl border transition-all duration-200
            ${searchFocused
              ? "border-primary/30 bg-white shadow-[0_0_0_3px_rgba(79,70,229,0.08)] ring-1 ring-primary/10"
              : "border-border-light bg-secondary/50 hover:bg-secondary/80"
            }
          `}
        >
          <Search className={`w-4 h-4 shrink-0 transition-colors ${searchFocused ? "text-primary" : "text-muted-foreground"}`} />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Patienten, Angehörige, Tickets suchen…"
            className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-foreground/60"
            style={{ fontWeight: 400 }}
          />
          {searchValue ? (
            <button onClick={() => setSearchValue("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5" style={{ fontWeight: 500 }}>
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          )}
        </div>
      </div>

      {/* ── Spacer ──────────────────────── */}
      <div className="flex-1" />

      {/* ── Quick Add ───────────────────── */}
      <button className="flex items-center gap-1.5 px-3 py-[7px] bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors shadow-sm text-[13px]" style={{ fontWeight: 500 }}>
        <Plus className="w-4 h-4" />
        <span className="hidden md:inline">Schnellerfassung</span>
      </button>

      {/* ── Notifications ───────────────── */}
      <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
        <Bell className="w-[18px] h-[18px] text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-card" />
      </button>

      {/* ── Separator ───────────────────── */}
      <div className="w-px h-6 bg-border" />

      {/* ── User Profile ────────────────── */}
      <button className="flex items-center gap-2.5 px-1.5 py-1 rounded-xl hover:bg-secondary transition-colors -mr-1">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
          <span className="text-[11px] text-white" style={{ fontWeight: 600 }}>MK</span>
        </div>
        <div className="hidden lg:flex flex-col items-start">
          <span className="text-[12.5px] text-foreground" style={{ fontWeight: 500 }}>Maria Keller</span>
          <span className="text-[10.5px] text-muted-foreground" style={{ fontWeight: 400 }}>Admin</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
      </button>
    </header>
  );
}
