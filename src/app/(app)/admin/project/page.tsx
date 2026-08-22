import { requireAdmin } from "@/lib/auth";
import {
  IconAlertCircle,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconFileText,
  IconProject,
  IconShield,
} from "@/components/Icons";

const shippedModules = [
  { name: "Authentication", detail: "Sign-up, verification, sessions and role-based access" },
  { name: "Employee profiles", detail: "Self-service details and HR-managed employee records" },
  { name: "Attendance", detail: "Check-in/out, weekly records and HR overrides" },
  { name: "Leave workflows", detail: "Balances, requests, approvals and attendance sync" },
  { name: "Payroll", detail: "Salary visibility, admin editing and revision history" },
  { name: "Automated tests", detail: "221 unit, component and integration tests" },
];

// Mirrors the open sub-issues of "Epic: v0.2 release readiness" (#17).
const roadmap = [
  {
    issue: 10,
    title: "Send verification email",
    area: "Authentication",
    priority: "P0",
    effort: "M",
    state: "Blocked",
    dependency: "Mail provider account and API key",
    description:
      "The single-use link is still only written to the server log. Deliver it by email and add a resend path.",
  },
  {
    issue: 11,
    title: "Upload employee documents",
    area: "Employee profile",
    priority: "P1",
    effort: "M",
    state: "Blocked",
    dependency: "Private file-storage provider",
    description:
      "The documents table exists; the upload action and employee-only download route do not.",
  },
  {
    issue: 12,
    title: "Turn on CI",
    area: "Infrastructure",
    priority: "P1",
    effort: "S",
    state: "Ready",
    dependency: "GitHub token with workflow scope",
    description: "Move the prepared workflow in ci/ into .github/workflows so every change is checked.",
  },
  {
    issue: 13,
    title: "Add end-to-end tests",
    area: "Testing",
    priority: "P2",
    effort: "L",
    state: "Ready",
    dependency: "None",
    description: "Cover sign-up, attendance, leave application and HR approval in a browser.",
  },
  {
    issue: 15,
    title: "Payslips and reports",
    area: "Payroll",
    priority: "P3",
    effort: "L",
    state: "In progress",
    dependency: "Admin screens for the payroll-run actions",
    description:
      "Payroll runs, salary snapshots and payslips are implemented and tested in src/lib/payroll.ts; no screen or server action reaches them yet, and reports are not started.",
  },
] as const;

// Merged pull requests since the v0.1 core release, newest first.
const delivered = [
  {
    pr: 22,
    title: "Deployment prep: dashboard fix, seed typecheck fix, landing page",
    note: "Payroll tables added to the migration and seed reset lists",
  },
  { pr: 21, title: "Wiki documentation suite", note: "Architecture, data model, routes and testing guides" },
  { pr: 20, title: "Documentation for the full application", note: "Attendance, auth, leave, payroll, deploying" },
  {
    pr: 18,
    title: "Vercel configuration and versioned migrations",
    note: "Closed the shared-environment work (#14) — v0.2.0.1",
  },
  { pr: 3, title: "Routing pages and project architecture guide", note: "Spec-to-code map in the README" },
  {
    pr: 2,
    title: "Visual rebuild, delivery page, payroll runs, atomic leave",
    note: "v0.2.0.0 — payroll snapshots and finalisation landed here",
  },
] as const;

const priorityTone = {
  P0: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900",
  P1: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  P2: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900",
  P3: "bg-surface-muted text-muted ring-line",
};

const stateTone = {
  Blocked: "text-danger",
  Ready: "text-success",
  "In progress": "text-warning",
};

export default async function ProjectDashboardPage() {
  await requireAdmin();

  const blockedCount = roadmap.filter((item) => item.state === "Blocked").length;
  const readyCount = roadmap.filter((item) => item.state === "Ready").length;

  return (
    <div className="space-y-8">
      <header className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">
              <IconProject size={15} />
              Delivery workspace
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Dayflow project progress
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              The core HRMS is working and now runs on a hosted environment with versioned migrations. What is left of the v0.2 epic is email delivery, secure files, active CI, browser coverage and the payroll-run screens.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand">
              <IconCheckCircle size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current release</p>
              <p className="font-bold text-foreground">v0.2.0.1 · Deployed</p>
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-surface-muted">
          <div className="h-full w-full bg-brand" />
        </div>
      </header>

      <section aria-label="Project summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Core modules" value="6 / 6" note="Requirements 3.1–3.6" icon={<IconCheckCircle size={20} />} tone="text-success bg-success-soft" />
        <Metric label="Automated tests" value="221" note="25 files · unit, component, integration" icon={<IconShield size={20} />} tone="text-brand bg-brand-soft" />
        <Metric label="Ready to start" value={String(readyCount)} note="No product decision needed" icon={<IconClock size={20} />} tone="text-brand bg-brand-soft" />
        <Metric label="External blockers" value={String(blockedCount)} note="Provider credentials needed" icon={<IconAlertCircle size={20} />} tone="text-danger bg-danger-soft" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.7fr]">
        <section className="card p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wider text-success">Completed</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">Core product scope</h2>
          </div>
          <div className="space-y-1">
            {shippedModules.map((module) => (
              <div key={module.name} className="flex gap-3 rounded-xl px-2 py-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                  <IconCheck size={13} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{module.name}</h3>
                  <p className="mt-0.5 text-xs leading-5 text-muted">{module.detail}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-3 rounded-xl px-2 py-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                <IconCheck size={13} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Shared environment</h3>
                <p className="mt-0.5 text-xs leading-5 text-muted">
                  Hosted deployment, production secrets and versioned migrations
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-line p-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand">Next up</p>
              <h2 className="mt-1 text-lg font-bold text-foreground">Delivery roadmap</h2>
            </div>
            <p className="text-xs text-muted">Open sub-issues of the v0.2 epic</p>
          </div>
          <div className="divide-y divide-line">
            {roadmap.map((item) => (
              <article key={item.title} className="grid gap-4 p-5 transition-colors hover:bg-surface-muted/50 sm:grid-cols-[3rem_1fr_auto] sm:p-6">
                <span className="text-sm font-bold tabular-nums text-muted/60">#{item.issue}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <span className={`pill text-[10px] ${priorityTone[item.priority]}`}>{item.priority}</span>
                    <span className="pill bg-surface-muted text-muted ring-line text-[10px]">{item.effort}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                    <span className="font-semibold text-muted">{item.area}</span>
                    <span className="flex items-center gap-1.5 text-muted">
                      <IconFileText size={13} /> {item.dependency}
                    </span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 self-start text-xs font-bold ${stateTone[item.state]}`}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {item.state}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-line p-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand">Change log</p>
            <h2 className="mt-1 text-lg font-bold text-foreground">Merged since the core release</h2>
          </div>
          <p className="text-xs text-muted">Newest first</p>
        </div>
        <ul className="divide-y divide-line">
          {delivered.map((item) => (
            <li key={item.pr} className="grid gap-3 p-5 sm:grid-cols-[4rem_1fr] sm:p-6">
              <span className="text-sm font-bold tabular-nums text-muted/60">#{item.pr}</span>
              <div>
                <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted">{item.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 rounded-2xl border border-line bg-surface-muted/50 p-5 sm:grid-cols-3 sm:p-6">
        <Gate title="Product" state="Ready" detail="Core employee and HR workflows are implemented." />
        <Gate title="Quality" state="Partial" detail="221 tests pass locally; browser flows and active CI remain." />
        <Gate title="Operations" state="Partial" detail="Hosted and migrated; email delivery and secure file storage remain." />
      </section>
    </div>
  );
}

function Metric({ label, value, note, icon, tone }: { label: string; value: string; note: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="card p-5">
      <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${tone}`}>{icon}</div>
      <p className="text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-sm font-bold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}

function Gate({ title, state, detail }: { title: string; state: string; detail: string }) {
  const tone = state === "Ready" ? "text-success" : state === "Partial" ? "text-warning" : "text-danger";
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className={`text-xs font-bold ${tone}`}>{state}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{detail}</p>
    </div>
  );
}
