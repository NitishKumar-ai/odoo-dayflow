"use client";

import { useEffect, useState } from "react";

export function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="flex items-center gap-2 font-mono text-sm text-muted">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>--:--:--</span>
      </div>
    );
  }

  const hours = time.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex items-center gap-2 font-mono text-sm font-semibold tabular-nums text-foreground">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50" />
      <span>{hours}</span>
    </div>
  );
}
