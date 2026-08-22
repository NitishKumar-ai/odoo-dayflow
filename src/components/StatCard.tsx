import React from "react";
import Link from "next/link";

export type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  tone?: "brand" | "success" | "warning" | "danger" | "neutral";
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  href?: string;
};

const toneStyles = {
  brand: {
    bg: "bg-blue-50/70 dark:bg-blue-950/30",
    border: "border-blue-200/80 dark:border-blue-800/40",
    iconBg: "bg-brand text-white",
    value: "text-foreground",
  },
  success: {
    bg: "bg-emerald-50/70 dark:bg-emerald-950/30",
    border: "border-emerald-200/80 dark:border-emerald-800/40",
    iconBg: "bg-emerald-600 text-white",
    value: "text-foreground",
  },
  warning: {
    bg: "bg-amber-50/70 dark:bg-amber-950/30",
    border: "border-amber-200/80 dark:border-amber-800/40",
    iconBg: "bg-amber-600 text-white",
    value: "text-foreground",
  },
  danger: {
    bg: "bg-rose-50/70 dark:bg-rose-950/30",
    border: "border-rose-200/80 dark:border-rose-800/40",
    iconBg: "bg-rose-600 text-white",
    value: "text-foreground",
  },
  neutral: {
    bg: "bg-surface",
    border: "border-line",
    iconBg: "bg-surface-muted text-muted",
    value: "text-foreground",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "neutral",
  trend,
  href,
}: StatCardProps) {
  const styles = toneStyles[tone];

  const content = (
    <div
      className={`card p-5 transition-all duration-200 ${styles.bg} ${styles.border} ${
        href ? "hover:border-brand/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
        </div>
        {icon && (
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-xs ${styles.iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          {trend && (
            <span
              className={`inline-flex items-center font-bold ${
                trend.isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
