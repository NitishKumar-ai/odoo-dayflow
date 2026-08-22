import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "@/actions/auth";
import { Brand } from "@/components/Brand";
import { Nav, type NavItem } from "@/components/Nav";

const employeeNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/attendance", label: "Attendance" },
  { href: "/leave", label: "Leave" },
  { href: "/payroll", label: "Salary" },
];

const adminNav: NavItem[] = [
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/attendance", label: "Attendance" },
  { href: "/admin/leave", label: "Approvals" },
  { href: "/admin/payroll", label: "Payroll" },
];

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/dashboard">
            <Brand />
          </Link>

          <div className="flex-1">
            <Nav items={isAdmin ? [employeeNav[0], ...adminNav] : employeeNav} />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-muted leading-tight">
                {isAdmin ? "HR / Admin" : "Employee"} · {user.employeeCode}
              </p>
            </div>
            <form action={signOutAction}>
              <button type="submit" className="btn-secondary">Log out</button>
            </form>
          </div>
        </div>

        {isAdmin ? (
          <div className="border-t border-line bg-surface-muted">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-1.5">
              <span className="text-xs text-muted">My own records:</span>
              <Nav items={employeeNav.slice(1)} />
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
