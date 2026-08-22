"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  IconDashboard,
  IconProfile,
  IconAttendance,
  IconLeave,
  IconPayroll,
  IconEmployees,
  IconApprovals,
} from "@/components/Icons";

export type NavItem = {
  href: string;
  label: string;
  badge?: number | string;
};

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Dashboard: IconDashboard,
  Profile: IconProfile,
  Attendance: IconAttendance,
  Leave: IconLeave,
  Salary: IconPayroll,
  Employees: IconEmployees,
  Approvals: IconApprovals,
  Payroll: IconPayroll,
};

export function Nav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const IconComponent = iconMap[item.label];

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150 ${
              active
                ? "bg-brand text-white shadow-xs shadow-brand/25 font-semibold"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {IconComponent && (
              <IconComponent
                size={16}
                className={`transition-colors ${
                  active ? "text-white" : "text-muted group-hover:text-foreground"
                }`}
              />
            )}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge !== 0 ? (
              <span
                className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                  active
                    ? "bg-white text-brand"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"
                }`}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
