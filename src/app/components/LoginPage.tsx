import { useState } from "react";
import { useAuth } from "../auth";
import { AlertCircle } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    if (!login(username, password)) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-primary)", fontFamily: "var(--font-family)" }}>
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center justify-center" style={{ width: 48, height: 48, borderRadius: "var(--radius-card)", background: "var(--brand-primary)" }}>
            <span style={{ color: "var(--text-on-dark)", fontSize: 22, fontWeight: "var(--weight-medium)" }}>S</span>
          </div>
        </div>

        <h1 className="text-center" style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>
          Spitex-Cockpit
        </h1>
        <p className="text-center" style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>
          Bitte melden Sie sich an
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "var(--space-4)" }}>
          {error && (
            <div className="flex items-center" style={{ gap: "var(--space-2)", padding: "var(--space-3)", borderRadius: "var(--radius-card)", background: "var(--status-danger-bg)", border: "var(--border-thin) solid var(--status-danger)", fontSize: "var(--text-meta)", color: "var(--status-danger)" }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              Benutzername oder Passwort ist falsch.
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", marginBottom: "var(--space-1)" }}>
              Benutzername
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              className="w-full outline-none transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "var(--border-thin) solid var(--border-default)",
                borderRadius: "var(--radius-card)",
                padding: "11px 16px",
                fontSize: "var(--text-body)",
                color: "var(--text-primary)",
              }}
              onFocus={e => e.currentTarget.style.border = "var(--border-thick) solid var(--brand-primary)"}
              onBlur={e => e.currentTarget.style.border = "var(--border-thin) solid var(--border-default)"}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", marginBottom: "var(--space-1)" }}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full outline-none transition-all"
              style={{
                background: "var(--bg-elevated)",
                border: "var(--border-thin) solid var(--border-default)",
                borderRadius: "var(--radius-card)",
                padding: "11px 16px",
                fontSize: "var(--text-body)",
                color: "var(--text-primary)",
              }}
              onFocus={e => e.currentTarget.style.border = "var(--border-thick) solid var(--brand-primary)"}
              onBlur={e => e.currentTarget.style.border = "var(--border-thin) solid var(--border-default)"}
            />
          </div>

          <button
            type="submit"
            className="w-full cursor-pointer transition-colors"
            style={{
              padding: "10px 22px",
              borderRadius: "var(--radius-pill)",
              background: "var(--brand-primary)",
              color: "var(--text-on-dark)",
              fontSize: "var(--text-body)",
              fontWeight: "var(--weight-medium)",
              border: "none",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
