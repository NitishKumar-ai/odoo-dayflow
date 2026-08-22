import Link from "next/link";
import { Brand } from "@/components/Brand";
import {
  IconAttendance,
  IconLeave,
  IconPayroll,
  IconEmployees,
  IconCheck,
  IconArrowRight,
  IconSparkles,
  IconShield,
  IconClock,
  IconTrendingUp,
} from "@/components/Icons";
import { getSessionUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-brand selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Brand size="md" />

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="btn-primary shadow-md shadow-brand/20"
              >
                <span>Go to Dashboard</span>
                <IconArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link href="/signin" className="btn-secondary">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary shadow-md shadow-brand/20 hidden sm:inline-flex"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
          {/* Subtle Background Glows */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-brand/20 to-indigo-500/20 blur-3xl"
          />

          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3.5 py-1.5 text-xs font-semibold text-brand shadow-xs">
              <IconSparkles size={14} />
              <span>Next-Gen Workday & HR Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl sm:leading-tight">
              Every Workday,{" "}
              <span className="bg-gradient-to-r from-brand via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Perfectlys Aligned.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted sm:text-xl">
              Dayflow unifies employee attendance, intelligent leave balance tracking,
              transparent salary compensation structures, and central administrative approvals into one effortless experience.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={user ? "/dashboard" : "/signin"}
                className="btn-primary px-6 py-3.5 text-base shadow-lg shadow-brand/25"
              >
                <span>{user ? "Open Workspace" : "Get Started Now"}</span>
                <IconArrowRight size={18} />
              </Link>
              <Link
                href="/signup"
                className="btn-secondary px-6 py-3.5 text-base"
              >
                <span>Create Company Account</span>
              </Link>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="mt-12 mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-5 shadow-sm text-left">
              <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Instant Demo Accounts Available
                  </span>
                </div>
                <span className="text-xs font-medium text-brand">Pass: Dayflow#2026</span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl bg-surface-muted p-3 border border-line/60">
                  <div>
                    <p className="text-xs font-bold text-foreground">HR Manager / Admin</p>
                    <p className="text-xs text-muted font-mono">asha@dayflow.test</p>
                  </div>
                  <Link
                    href="/signin?demo=admin"
                    className="btn-primary btn-sm text-xs font-semibold"
                  >
                    Login Admin
                  </Link>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-surface-muted p-3 border border-line/60">
                  <div>
                    <p className="text-xs font-bold text-foreground">Software Engineer</p>
                    <p className="text-xs text-muted font-mono">rohan@dayflow.test</p>
                  </div>
                  <Link
                    href="/signin?demo=employee"
                    className="btn-secondary btn-sm text-xs font-semibold"
                  >
                    Login Staff
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Showcase */}
        <section className="border-t border-line bg-surface-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand">Core Capabilities</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Everything your team needs to thrive
              </p>
              <p className="mt-4 text-sm text-muted">
                Engineered with high performance, strict type safety, and intuitive user experiences.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Feature 1: Attendance */}
              <div className="card p-6 card-hover">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-brand dark:bg-blue-950/50">
                  <IconAttendance size={24} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">Precision Punch-Clock</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Real-time clock in/out with automated daily work-hour derivation, weekend exclusion, and manual admin overrides.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-muted">
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-emerald-600" />
                    <span>Daily duration calculation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-emerald-600" />
                    <span>Weekly heatmap matrix</span>
                  </li>
                </ul>
              </div>

              {/* Feature 2: Leave */}
              <div className="card p-6 card-hover">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
                  <IconLeave size={24} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">Intelligent Time-Off</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Apply for paid, sick, or unpaid leave with live balance checks, weekend skipping, and automated attendance sync upon approval.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-muted">
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-emerald-600" />
                    <span>Automatic calendar stamping</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-emerald-600" />
                    <span>Instant request withdrawal</span>
                  </li>
                </ul>
              </div>

              {/* Feature 3: Payroll */}
              <div className="card p-6 card-hover">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                  <IconPayroll size={24} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">Transparent Salary</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Detailed monthly salary breakdowns (Basic, HRA, Allowances, Deductions) with full audit trails and revision history.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-muted">
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-emerald-600" />
                    <span>Itemized monthly paystubs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-emerald-600" />
                    <span>Audit-trailed revisions</span>
                  </li>
                </ul>
              </div>

              {/* Feature 4: Staff Directory */}
              <div className="card p-6 card-hover">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50">
                  <IconEmployees size={24} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">Staff Hub & Directory</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Complete employee records with role-based access, instant search, document storage, and department tracking.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-muted">
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-emerald-600" />
                    <span>Role-based permissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCheck size={14} className="text-emerald-600" />
                    <span>Instant filter and search</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Security & Reliability Banner */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="card p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
                    <IconShield size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Enterprise Grade Security & Speed</h3>
                    <p className="mt-1 text-sm text-blue-200">
                      HTTP-Only JWT authentication, bcrypt password hashing, and Postgres transactions.
                    </p>
                  </div>
                </div>

                <Link
                  href="/signin"
                  className="btn bg-white text-slate-900 hover:bg-blue-50 shadow-md font-bold px-6 py-3 shrink-0"
                >
                  Enter Workspace
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Landing Footer */}
      <footer className="border-t border-line bg-surface py-8 text-center text-xs text-muted">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Brand size="sm" showTagline />
          <p>© {new Date().getFullYear()} Dayflow HRMS. Built for modern teams.</p>
        </div>
      </footer>
    </div>
  );
}
