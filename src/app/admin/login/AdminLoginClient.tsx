"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";

export default function AdminLoginClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validate redirect destination to avoid open redirect vulnerabilities
  const rawFrom = searchParams.get("from");
  const isSafeAdminPath =
    rawFrom &&
    /^\/admin(\/[A-Za-z0-9\-_/]*)?$/.test(rawFrom) &&
    !rawFrom.startsWith("//") &&
    !rawFrom.includes("\\");
  const destination = isSafeAdminPath ? rawFrom : "/admin";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setLoading(false);
        return;
      }

      window.location.href = destination;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-2xl border border-studio-border bg-studio-surface p-8 shadow-lg sm:p-10">
      <div className="shadow-xs mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-studio-border bg-studio-surfaceElevated text-studio-champagne">
        <Shield className="h-6 w-6" />
      </div>

      <h1 className="text-studio-primary text-center font-serif text-2xl font-normal tracking-tight sm:text-3xl">
        Staff Concierge
      </h1>
      <p className="text-studio-muted mt-1 text-center text-xs">
        Shadify Internal Management Portal
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-center text-xs text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} method="POST" action="#" className="mt-6 space-y-4 text-xs">
        <div>
          <label className="text-studio-muted block font-medium">Staff Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="concierge@shadify.in"
            className="text-studio-primary placeholder:text-studio-subtle mt-1.5 w-full rounded-lg border border-studio-border bg-studio-canvas px-3.5 py-2.5 text-xs focus:border-studio-champagne focus:outline-none focus:ring-1 focus:ring-studio-champagne"
          />
        </div>

        <div>
          <label className="text-studio-muted block font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="text-studio-primary placeholder:text-studio-subtle mt-1.5 w-full rounded-lg border border-studio-border bg-studio-canvas px-3.5 py-2.5 text-xs focus:border-studio-champagne focus:outline-none focus:ring-1 focus:ring-studio-champagne"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="shadow-xs w-full rounded-lg bg-studio-text-primary py-2.5 text-xs font-medium text-white transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Authenticating..." : "Sign In to Concierge"}
        </button>
      </form>
    </div>
  );
}
