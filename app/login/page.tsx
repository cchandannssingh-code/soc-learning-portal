"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (isAuthenticated) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, callbackUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        login();
      } else {
        setError("Incorrect password");
      }
    } catch (err) {
      setError("An error occurred");
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#071224] p-4">
      <div className="w-full max-w-md bg-[#0d1b31] border border-[#1e3354] rounded-xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          🔐 SOCForge
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-slate-300 text-sm mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#132541] border border-[#1e3354] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter password"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
