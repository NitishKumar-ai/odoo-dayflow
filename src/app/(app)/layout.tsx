import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOutAction } from "@/actions/auth";
import { Brand } from "@/components/Brand";
import { Nav, type NavItem } from "@/components/Nav";
import { Avatar } from "@/components/Avatar";
import { IconLogOut, IconShield, IconUser } from "@/components/Icons";
import { db, leaveRequests } from "@/db";
import { eq, sql } from "drizzle-orm";

const employeeNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/attendance", label: "Attendance" },
  { href: "/leave", label: "Leave" },
  { href: "/payroll", label: "Salary" },
  { href: "/profile", label: "Profile" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  let pendingApprovalsCount = 0;
  if (isAdmin) {
    const [p] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(eq(leaveRequests.status, "pending"));
    pendingApprovalsCount = p?.n ?? 0;
  }

  const adminNav: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/admin/employees", label: "Employees" },
    { href: "/admin/attendance", label: "Attendance" },
    {
      href: "/admin/leave",
      label: "Approvals",
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { href: "/admin/payroll", label: "Payroll" },
    { href: "/admin/project", label: "Project" },
  ];

  return (
    <div className="app-shell flex min-h-screen flex-col bg-background">
      {/* Top Navbar */}
      <header className="app-header sticky top-0 z-40 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:flex-nowrap lg:px-8">
          {/* Brand Logo */}
          <Link href="/dashboard" className="transition-opacity hover:opacity-90">
            <Brand size="md" />
          </Link>

          {/* Primary Navigation */}
          <div className="order-3 min-w-0 basis-full overflow-x-auto overscroll-x-contain py-1 lg:order-none lg:basis-auto lg:flex-1">
            <Nav items={isAdmin ? adminNav : employeeNav} />
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-md border border-foreground/30 bg-surface p-1.5 transition-colors hover:border-brand sm:pr-3"
            >
              <Avatar name={user.name} size={32} />
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold leading-tight text-foreground">{user.name}</p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${
                      isAdmin ? "text-brand" : "text-muted"
                    }`}
                  >
                    {isAdmin && <IconShield size={10} />}
                    {isAdmin ? "Admin / HR" : "Employee"}
                  </span>
                  <span className="text-[10px] text-muted">· {user.employeeCode}</span>
                </div>
              </div>
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out of Dayflow"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-foreground/30 bg-surface text-muted transition-colors hover:border-danger hover:bg-danger-soft hover:text-danger"
              >
                <IconLogOut size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Sub-bar for Admin to toggle their own personal records */}
        {isAdmin && (
          <div className="border-t border-line/60 bg-surface-muted/40">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
              <div className="hidden shrink-0 items-center gap-2 text-xs font-semibold text-muted sm:flex">
                <IconUser size={13} className="text-brand" />
                <span>My Personal Workspace:</span>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto sm:flex-none">
                <Link
                  href="/attendance"
                  className="flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-foreground"
                >
                  My Attendance
                </Link>
                <Link
                  href="/leave"
                  className="flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-foreground"
                >
                  My Leaves
                </Link>
                <Link
                  href="/payroll"
                  className="flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-foreground"
                >
                  My Salary
                </Link>
                <Link
                  href="/profile"
                  className="flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-foreground"
                >
                  My Profile
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="app-main mx-auto w-full max-w-[1480px] flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="app-footer py-6 text-center text-xs">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Dayflow HRMS. Every workday, perfectly aligned.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/attendance" className="hover:text-foreground transition-colors">Attendance</Link>
            <Link href="/leave" className="hover:text-foreground transition-colors">Time Off</Link>
            <Link href="/payroll" className="hover:text-foreground transition-colors">Salary</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
