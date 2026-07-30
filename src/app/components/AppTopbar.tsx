import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, X, Command, Menu, LogOut, ChevronDown, UserCog } from "lucide-react";
import { useAuth } from "../auth";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, MOCK_USERS, type UserRole } from "../../types/user";

const ROLES: UserRole[] = ["diplomiert", "backoffice", "management"];

interface AppTopbarProps {
  onMenuToggle?: () => void;
}

export function AppTopbar({ onMenuToggle }: AppTopbarProps) {
  const { logout, role, setRole, user } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!roleMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) setRoleMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [roleMenuOpen]);

  return (
    <header
      className="shrink-0 sticky top-0 z-30 flex items-center gap-[var(--space-3)]"
      style={{
        height: 52,
        background: "var(--bg-primary)",
        borderBottom: "var(--border-thin) solid var(--border-default)",
        padding: "0 var(--space-6)",
      }}
    >
      {/* Hamburger — below lg */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden flex items-center justify-center cursor-pointer"
        style={{ width: 40, height: 40, borderRadius: "var(--radius-card)" }}
        aria-label="Menü öffnen"
      >
        <Menu style={{ width: 20, height: 20, color: "var(--text-secondary)" }} />
      </button>

      {/* Mobile logo — below lg */}
      <div
        className="lg:hidden flex items-center justify-center shrink-0"
        style={{ width: 28, height: 28, borderRadius: "var(--radius-card)", background: "var(--brand-primary)" }}
      >
        <span style={{ color: "var(--text-on-dark)", fontSize: 12, fontWeight: "var(--weight-medium)" }}>S</span>
      </div>

      {/* Desktop search — begrenzte Breite (~220px), linke Kante auf der Inhaltsachse */}
      <div className="relative hidden sm:block shrink-0" style={{ width: 220 }}>
        <div
          className="flex items-center"
          style={{
            borderRadius: "var(--radius-pill)",
            border: searchFocused ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)",
            background: "var(--bg-elevated)",
            padding: "8px 12px 8px 36px",
          }}
        >
          <Search
            className="absolute"
            style={{ left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: searchFocused ? "var(--brand-primary)" : "var(--text-tertiary)" }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Patienten, Angehörige, Tickets suchen…"
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: "var(--text-body)", color: "var(--text-primary)", fontWeight: "var(--weight-regular)" }}
          />
          {searchValue ? (
            <button onClick={() => setSearchValue("")} className="cursor-pointer" style={{ color: "var(--text-secondary)" }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          ) : (
            <kbd
              className="hidden md:flex items-center gap-0.5"
              style={{
                fontSize: "var(--text-micro)",
                color: "var(--text-tertiary)",
                background: "var(--bg-secondary)",
                border: "var(--border-thin) solid var(--border-default)",
                borderRadius: "var(--radius-card)",
                padding: "2px 6px",
                fontWeight: "var(--weight-medium)",
              }}
            >
              <Command style={{ width: 10, height: 10 }} />K
            </kbd>
          )}
        </div>
      </div>

      {/* Mobile search icon */}
      <button
        onClick={() => setMobileSearchOpen(true)}
        className="sm:hidden flex items-center justify-center cursor-pointer"
        style={{ width: 40, height: 40, borderRadius: "var(--radius-card)" }}
        aria-label="Suche öffnen"
      >
        <Search style={{ width: 20, height: 20, color: "var(--text-secondary)" }} />
      </button>

      {/* Mobile full-screen search */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col" style={{ background: "var(--bg-elevated)" }}>
          <div className="flex items-center gap-2" style={{ padding: "var(--space-3)", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
            <Search style={{ width: 20, height: 20, color: "var(--text-secondary)" }} />
            <input
              autoFocus
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Suchen…"
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 15, color: "var(--text-primary)" }}
            />
            <button onClick={() => { setMobileSearchOpen(false); setSearchValue(""); }} className="cursor-pointer" style={{ padding: "var(--space-2)" }}>
              <X style={{ width: 20, height: 20, color: "var(--text-secondary)" }} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center" style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>
            Suchbegriff eingeben…
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Role switcher (Demo) */}
      <div className="relative hidden md:block" ref={roleMenuRef}>
        <div className="flex items-center" style={{ gap: 6 }}>
          <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Demo</span>
          <button
            onClick={() => setRoleMenuOpen(o => !o)}
            className="inline-flex items-center cursor-pointer transition-colors"
            style={{
              gap: 6, padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              background: "var(--bg-elevated)",
              border: "var(--border-thin) solid var(--border-default)",
              fontSize: "var(--text-small)",
              fontWeight: "var(--weight-medium)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
          >
            <UserCog style={{ width: 14, height: 14, color: "var(--text-secondary)" }} />
            {ROLE_LABELS[role]}
            <ChevronDown style={{ width: 12, height: 12, color: "var(--text-tertiary)", transition: "transform 0.15s", transform: roleMenuOpen ? "rotate(180deg)" : "none" }} />
          </button>
        </div>

        {roleMenuOpen && (
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-50"
            style={{
              background: "var(--bg-elevated)",
              border: "var(--border-thin) solid var(--border-default)",
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--shadow-overlay)",
              padding: "var(--space-2)",
              minWidth: 260,
            }}
          >
            {ROLES.map(r => {
              const u = MOCK_USERS[r];
              const isActive = r === role;
              return (
                <button
                  key={r}
                  onClick={() => { setRole(r); setRoleMenuOpen(false); }}
                  className="w-full flex items-center text-left cursor-pointer transition-colors"
                  style={{
                    gap: "var(--space-3)", padding: "10px 12px",
                    borderRadius: "var(--radius-card)",
                    background: isActive ? "var(--brand-primary-light)" : "transparent",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="shrink-0 flex items-center justify-center" style={{
                    width: 32, height: 32,
                    borderRadius: "var(--radius-avatar)",
                    background: u.color,
                  }}>
                    <span style={{ color: "var(--text-on-dark)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)" }}>{u.initialen}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: isActive ? "var(--brand-primary)" : "var(--text-primary)" }}>
                      {ROLE_LABELS[r]}
                    </div>
                    <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 1 }}>
                      {u.vorname} {u.name}, {ROLE_DESCRIPTIONS[r]}
                    </div>
                  </div>
                  {isActive && (
                    <div style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications */}
      <button
        className="relative flex items-center justify-center cursor-pointer"
        style={{
          width: 36, height: 36,
          borderRadius: "var(--radius-pill)",
          background: "var(--bg-elevated)",
          border: "var(--border-thin) solid var(--border-default)",
        }}
      >
        <Bell style={{ width: 18, height: 18, color: "var(--text-secondary)" }} />
        <span
          className="absolute"
          style={{
            top: 6, right: 6,
            width: 8, height: 8,
            borderRadius: "var(--radius-pill)",
            background: "var(--status-danger)",
            border: "2px solid var(--bg-primary)",
          }}
        />
      </button>

      {/* User avatar + dropdown */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(o => !o)}
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 36, height: 36,
            borderRadius: "var(--radius-avatar)",
            background: user.color,
          }}
        >
          <span style={{ color: "var(--text-on-dark)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)" }}>{user.initialen}</span>
        </button>

        {userMenuOpen && (
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-50"
            style={{
              background: "var(--bg-elevated)",
              border: "var(--border-thin) solid var(--border-default)",
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--shadow-overlay)",
              padding: "var(--space-3)",
              minWidth: 200,
            }}
          >
            <div style={{ padding: "var(--space-2) var(--space-3)", marginBottom: "var(--space-2)" }}>
              <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{user.vorname} {user.name}</div>
              <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{user.funktion}</div>
            </div>
            <div style={{ borderTop: "var(--border-thin) solid var(--border-default)", paddingTop: "var(--space-2)" }}>
              <button
                onClick={() => { setUserMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-2 cursor-pointer transition-colors"
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-card)",
                  fontSize: "var(--text-small)",
                  color: "var(--status-danger)",
                  fontWeight: "var(--weight-medium)",
                  background: "transparent",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--status-danger-bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut style={{ width: 16, height: 16 }} />
                Abmelden
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
