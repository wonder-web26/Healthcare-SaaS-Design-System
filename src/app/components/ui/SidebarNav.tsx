/**
 * SidebarNav — Optional companion for long multi-section captures (e.g. InterRAI).
 * Gemäss styleguide.md Sektion 8.14.
 *
 * Progress per section exclusively via count. No colored status or confidence dots.
 * Active entry highlighted via bg-secondary.
 */

interface SidebarNavEntry {
  id: string;
  label: string;
  count: string;   // e.g. "0/15" or "3/3"
}

interface SidebarNavProps {
  entries: SidebarNavEntry[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}

export function SidebarNav({ entries, activeId, onNavigate }: SidebarNavProps) {
  return (
    <nav className="flex flex-col" style={{ gap: 2 }}>
      {entries.map(entry => {
        const isActive = entry.id === activeId;
        return (
          <button
            key={entry.id}
            onClick={() => onNavigate(entry.id)}
            className="w-full flex items-center text-left cursor-pointer"
            style={{
              gap: 8,
              padding: "5px 8px",
              borderRadius: 12,
              background: isActive ? "var(--bg-secondary)" : "transparent",
              border: "none",
            }}
          >
            {/* Section letter marker */}
            <span style={{
              fontSize: "var(--text-small)",
              fontWeight: 600,
              color: isActive ? "var(--brand-primary)" : "var(--text-secondary)",
              minWidth: 16,
            }}>
              {entry.id}
            </span>

            {/* Section name */}
            <span
              className="flex-1 truncate"
              style={{
                fontSize: "var(--text-small)",
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                fontWeight: isActive ? 500 : 400,
              }}
            >
              {entry.label}
            </span>

            {/* Count — progress exclusively via numbers */}
            <span style={{
              fontSize: "var(--text-meta)",
              color: "var(--text-tertiary)",
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}>
              {entry.count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
