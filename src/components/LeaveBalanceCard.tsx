import React from "react";
import { IconLeave, IconClock, IconSparkles } from "@/components/Icons";
import { LEAVE_TYPE_LABEL, type LeaveType } from "@/lib/leave";

export type LeaveBalanceCardProps = {
  type: LeaveType;
  entitled: number;
  used: number;
  left: number;
};

const typeConfig: Record<
  LeaveType,
  {
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    barColor: string;
  }
> = {
  paid: {
    icon: <IconLeave size={20} />,
    color: "text-brand",
    bg: "bg-blue-50/60 dark:bg-blue-950/30",
    border: "border-blue-200/80 dark:border-blue-800/40",
    barColor: "bg-brand",
  },
  sick: {
    icon: <IconClock size={20} />,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50/60 dark:bg-amber-950/30",
    border: "border-amber-200/80 dark:border-amber-800/40",
    barColor: "bg-amber-500",
  },
  unpaid: {
    icon: <IconSparkles size={20} />,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50/60 dark:bg-purple-950/30",
    border: "border-purple-200/80 dark:border-purple-800/40",
    barColor: "bg-purple-500",
  },
};

export function LeaveBalanceCard({ type, entitled, used, left }: LeaveBalanceCardProps) {
  const config = typeConfig[type];
  const percent = entitled > 0 ? Math.min(100, Math.round((left / entitled) * 100)) : 100;

  return (
    <div className={`card p-5 ${config.bg} ${config.border} transition-all`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            {LEAVE_TYPE_LABEL[type]}
          </span>
          <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {left}{" "}
            <span className="text-sm font-semibold text-muted">
              / {entitled} days left
            </span>
          </p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl bg-surface shadow-xs ${config.color}`}>
          {config.icon}
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{used} days used this year</span>
          <span className="font-bold text-foreground">{percent}% available</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
