"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { IconShield, IconUser } from "@/components/Icons";

export function DemoLoginHelper({
  onSelect,
}: {
  onSelect: (email: string, pass: string) => void;
}) {
  const searchParams = useSearchParams();
  const demo = searchParams.get("demo");

  const accounts = [
    {
      role: "HR / Admin",
      email: "asha@dayflow.test",
      pass: "Dayflow#2026",
      key: "admin",
      icon: <IconShield size={14} className="text-brand" />,
      tone: "border-brand/30 bg-brand-soft/50 hover:bg-brand-soft",
    },
    {
      role: "Employee",
      email: "rohan@dayflow.test",
      pass: "Dayflow#2026",
      key: "employee",
      icon: <IconUser size={14} className="text-emerald-600" />,
      tone: "border-emerald-500/30 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/20",
    },
  ];

  useEffect(() => {
    if (demo === "admin") {
      onSelect("asha@dayflow.test", "Dayflow#2026");
    } else if (demo === "employee") {
      onSelect("rohan@dayflow.test", "Dayflow#2026");
    }
  }, [demo, onSelect]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Quick Demo Logins
        </span>
        <span className="text-[11px] text-muted">Click to auto-fill</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {accounts.map((acc) => (
          <button
            key={acc.key}
            type="button"
            onClick={() => onSelect(acc.email, acc.pass)}
            className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all ${acc.tone}`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
              {acc.icon}
              <span>{acc.role}</span>
            </div>
            <span className="mt-1 text-[11px] font-mono text-muted truncate w-full">
              {acc.email}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
