"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    router.push("/lobby");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-amber-400">Register</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && <p className="text-red-400 text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username (3-32 chars)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password (6+ chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-amber-500 focus:outline-none"
        />

        <button
          type="submit"
          className="w-full py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition"
        >
          Create Account
        </button>
      </form>

      <p className="mt-4 text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-amber-400 hover:underline">
          Login
        </Link>
      </p>
      <Link href="/" className="mt-2 text-gray-500 hover:text-gray-300">
        Back to home
      </Link>
    </div>
  );
}
