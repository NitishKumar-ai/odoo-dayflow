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
  IconProject,
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
  Project: IconProject,
};

export function Nav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-nowrap items-center gap-1 lg:justify-center">
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
            className={`group relative flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-all duration-150 ${
              active
                ? "bg-foreground text-surface shadow-[3px_3px_0_var(--signal)] font-semibold"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {IconComponent && (
              <IconComponent
                size={16}
                className={`transition-colors ${
                  active ? "text-surface" : "text-muted group-hover:text-foreground"
                }`}
              />
            )}
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge !== 0 ? (
              <span
                className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                  active
                    ? "bg-daylight text-foreground"
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
