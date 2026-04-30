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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="9" cy="9" r="3" fill="white" opacity="0.9" />
            </svg>
          </div>
        </div>

        <h1 className="text-center text-foreground mb-1" style={{ fontSize: 20, fontWeight: 600 }}>
          Spitex-Cockpit
        </h1>
        <p className="text-center text-[13px] text-muted-foreground mb-6">
          Bitte melden Sie sich an
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-error-light border border-error/20 text-[12px] text-error-foreground">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Benutzername oder Passwort ist falsch.
            </div>
          )}

          <div>
            <label className="text-[12px] text-muted-foreground block mb-1.5" style={{ fontWeight: 500 }}>
              Benutzername
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              className="w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all"
            />
          </div>

          <div>
            <label className="text-[12px] text-muted-foreground block mb-1.5" style={{ fontWeight: 500 }}>
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-[14px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors text-[14px] cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
