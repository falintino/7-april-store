"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    // Refresh server-rendered order statuses without a full browser reload.
    const interval = window.setInterval(() => {
      router.refresh();
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-bold text-blue-300">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
      Auto-refresh aktif · 10 detik
    </div>
  );
}
