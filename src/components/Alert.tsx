import React from "react";
import { IconAlertCircle, IconCheckCircle, IconSparkles } from "@/components/Icons";

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info" | "warning";
  children: React.ReactNode;
}) {
  const tones = {
    error: {
      wrap: "border-rose-200 bg-rose-50/90 text-rose-800 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-200",
      icon: <IconAlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />,
    },
    success: {
      wrap: "border-emerald-200 bg-emerald-50/90 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-200",
      icon: <IconCheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
    },
    warning: {
      wrap: "border-amber-200 bg-amber-50/90 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-200",
      icon: <IconAlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />,
    },
    info: {
      wrap: "border-blue-200 bg-blue-50/90 text-blue-900 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-200",
      icon: <IconSparkles size={18} className="text-brand shrink-0" />,
    },
  } as const;

  const current = tones[tone];

  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm font-medium shadow-xs ${current.wrap}`}
    >
      {current.icon}
      <div className="flex-1 leading-relaxed">{children}</div>
    </div>
  );
}
