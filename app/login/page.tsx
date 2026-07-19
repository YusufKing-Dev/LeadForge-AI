"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <span
            className="display"
            style={{
              fontSize: "13px",
              letterSpacing: "0.14em",
              color: "var(--ember)",
              fontWeight: 600,
            }}
          >
            ◆ LEADFORGE
          </span>
        </div>
        <h1
          className="display"
          style={{ fontSize: "28px", margin: "0 0 28px", fontWeight: 700 }}
        >
          Sign in to your workspace
        </h1>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--steel-300)",
              marginBottom: "6px",
            }}
          >
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--steel-300)",
              margin: "16px 0 6px",
            }}
          >
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          {error && (
            <p
              style={{
                color: "#ff9d80",
                fontSize: "13px",
                marginTop: "14px",
                marginBottom: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "12px",
              background: loading ? "var(--ember-dim)" : "var(--ember)",
              color: "var(--char-950)",
              border: "none",
              borderRadius: "4px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: loading ? "default" : "pointer",
              letterSpacing: "0.01em",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  background: "var(--char-900)",
  border: "1px solid var(--char-700)",
  borderRadius: "4px",
  color: "var(--steel-100)",
  fontSize: "14px",
};
