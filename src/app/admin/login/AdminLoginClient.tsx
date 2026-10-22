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
    <div className="w-full max-w-sm rounded-2xl border border-[#C9933A]/30 bg-[#14080C] p-8 shadow-2xl">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#C9933A]/10 text-[#C9933A]">
        <Shield className="h-6 w-6" />
      </div>

      <h1 className="text-center font-serif text-2xl font-light text-[#FFF9F2]">Staff Concierge</h1>
      <p className="mt-1 text-center text-xs text-[#E2D5C7]/60">
        Shadify Internal Management Portal
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 p-2.5 text-center text-xs text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} method="POST" action="#" className="mt-6 space-y-4 text-xs">
        <div>
          <label className="block text-[#E2D5C7]/80">Staff Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="concierge@shadify.in"
            className="mt-1 w-full rounded-lg border border-[#C9933A]/30 bg-[#0A0406] px-3 py-2 text-[#FFF9F2] placeholder:text-stone-500 focus:border-[#C9933A] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[#E2D5C7]/80">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-[#C9933A]/30 bg-[#0A0406] px-3 py-2 text-[#FFF9F2] placeholder:text-stone-500 focus:border-[#C9933A] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-[#C9933A] to-[#DFB15B] py-2.5 font-semibold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? "Authenticating..." : "Sign In to Concierge"}
        </button>
      </form>
    </div>
  );
}
