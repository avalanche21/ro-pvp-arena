"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
      <p className="text-xl text-amber-400">Loading arena...</p>
    </div>
  ),
});

function PlayContent() {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const className = searchParams.get("class") || "Knight";
  const gender = searchParams.get("gender") || "m";

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  if (!token) return null;

  return <GameCanvas token={token} className={className} gender={gender} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center w-screen h-screen bg-gray-900">
        <p className="text-xl text-amber-400">Loading arena...</p>
      </div>
    }>
      <PlayContent />
    </Suspense>
  );
}
