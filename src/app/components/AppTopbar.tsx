import React, { useState } from "react";
import { Search, Plus, Bell, ChevronDown, X, Command, Menu } from "lucide-react";

interface AppTopbarProps {
  onMenuToggle?: () => void;
}

export function AppTopbar({ onMenuToggle }: AppTopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="h-14 sm:h-16 bg-card border-b border-border flex items-center px-3 sm:px-6 gap-2 sm:gap-4 shrink-0 sticky top-0 z-30">
      {/* Hamburger — visible below lg */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 -ml-1 rounded-xl hover:bg-secondary transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Mobile logo — visible below lg */}
      <div className="lg:hidden w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
          <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke="white" strokeWidth="1.5" fill="none" />
          <circle cx="9" cy="9" r="3" fill="white" opacity="0.9" />
        </svg>
      </div>

      {/* Desktop search */}
      <div className={`relative flex-1 max-w-[480px] transition-all duration-200 hidden sm:block ${searchFocused ? "max-w-[560px]" : ""}`}>
        <div
          className={`flex items-center gap-2 px-3 py-[7px] rounded-xl border transition-all duration-200 ${
            searchFocused
              ? "border-primary/30 bg-white shadow-[0_0_0_3px_rgba(79,70,229,0.08)] ring-1 ring-primary/10"
              : "border-border-light bg-secondary/50 hover:bg-secondary/80"
          }`}
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
            <kbd className="hidden md:flex items-center gap-0.5 text-[10px] text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5" style={{ fontWeight: 500 }}>
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          )}
        </div>
      </div>

      {/* Mobile search icon */}
      <button
        onClick={() => setMobileSearchOpen(true)}
        className="sm:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
        aria-label="Suche öffnen"
      >
        <Search className="w-5 h-5 text-muted-foreground" />
      </button>

      {/* Mobile full-screen search */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-card sm:hidden flex flex-col">
          <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Suchen…"
              className="flex-1 bg-transparent outline-none text-[15px]"
            />
            <button onClick={() => { setMobileSearchOpen(false); setSearchValue(""); }} className="p-2 -mr-1">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center text-[13px] text-muted-foreground">
            Suchbegriff eingeben…
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Quick Add — hidden on mobile */}
      <button className="hidden sm:flex items-center gap-1.5 px-3 py-[7px] bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors shadow-sm text-[13px]" style={{ fontWeight: 500 }}>
        <Plus className="w-4 h-4" />
        <span className="hidden md:inline">Schnellerfassung</span>
      </button>

      {/* Notifications */}
      <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
        <Bell className="w-[18px] h-[18px] text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-card" />
      </button>

      {/* Separator — hidden on mobile */}
      <div className="hidden sm:block w-px h-6 bg-border" />

      {/* User Profile */}
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
