import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, leaveRequests, employees, users } from "@/db";
import { requireAdmin } from "@/lib/auth";
import {
  LEAVE_STATUS_LABEL,
  LEAVE_STATUS_TONE,
  LEAVE_TYPE_LABEL,
  type LeaveStatus,
} from "@/lib/leave";
import { formatDate } from "@/lib/dates";
import { Avatar } from "@/components/Avatar";
import { DecideLeave } from "@/components/admin/DecideLeave";
import {
  IconApprovals,
} from "@/components/Icons";

const TABS: { key: LeaveStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All Requests" },
];

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminLeavePage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const tab = (typeof params.status === "string" ? params.status : "pending") as
    | LeaveStatus
    | "all";

  const base = db
    .select({
      id: leaveRequests.id,
      leaveType: leaveRequests.leaveType,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      days: leaveRequests.days,
      remarks: leaveRequests.remarks,
      status: leaveRequests.status,
      decisionComment: leaveRequests.decisionComment,
      decidedAt: leaveRequests.decidedAt,
      createdAt: leaveRequests.createdAt,
      employeeId: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      photoUrl: employees.photoUrl,
      employeeCode: users.employeeCode,
      department: employees.department,
      jobTitle: employees.jobTitle,
    })
    .from(leaveRequests)
    .innerJoin(employees, eq(employees.id, leaveRequests.employeeId))
    .innerJoin(users, eq(users.id, employees.userId))
    .orderBy(desc(leaveRequests.createdAt));

  const rows =
    tab === "all"
      ? await base
      : await base.where(eq(leaveRequests.status, tab));

  const [counts] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${leaveRequests.status} = 'pending')::int`,
      approved: sql<number>`count(*) filter (where ${leaveRequests.status} = 'approved')::int`,
      rejected: sql<number>`count(*) filter (where ${leaveRequests.status} = 'rejected')::int`,
    })
    .from(leaveRequests);

  return (
    <div className="space-y-8">
      {/* Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Leave Approvals Hub
          </h1>
          <p className="mt-1 text-sm text-muted">
            Review and make decisions on employee time-off requests across the organization.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="pill bg-amber-50 text-amber-700 ring-amber-600/20 font-bold">
            {counts.pending} Pending
          </span>
          <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-600/20 font-bold">
            {counts.approved} Approved
          </span>
          <span className="pill bg-rose-50 text-rose-700 ring-rose-600/20 font-bold">
            {counts.rejected} Rejected
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-line">
        <nav className="flex flex-wrap gap-2 pb-2">
          {TABS.map((t) => {
            const count =
              t.key === "pending"
                ? counts.pending
                : t.key === "approved"
                  ? counts.approved
                  : t.key === "rejected"
                    ? counts.rejected
                    : counts.pending + counts.approved + counts.rejected;

            const isActive = tab === t.key;

            return (
              <Link
                key={t.key}
                href={`/admin/leave?status=${t.key}`}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-brand text-white shadow-xs shadow-brand/20"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-surface-muted text-muted"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Requests Feed */}
      {rows.length === 0 ? (
        <div className="card p-12 text-center text-muted">
          <IconApprovals size={36} className="mx-auto mb-2 text-muted/50" />
          <p className="font-bold text-foreground">No requests found</p>
          <p className="mt-1 text-xs text-muted">
            There are currently no leave applications under the “{tab}” category.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const name = `${r.firstName} ${r.lastName}`.trim();

            return (
              <li key={r.id} className="card p-6 shadow-xs card-hover">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Left Column: Requester info & Request details */}
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar name={name} photoUrl={r.photoUrl} size={48} />
                    <div className="space-y-2 flex-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/employees/${r.employeeId}`}
                            className="font-bold text-base text-foreground hover:text-brand hover:underline"
                          >
                            {name}
                          </Link>
                          <span className="pill bg-surface-muted text-muted ring-line text-[10px] font-mono">
                            {r.employeeCode}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          {r.jobTitle || "Role not set"} · {r.department || "General"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="rounded-lg bg-surface-muted px-2.5 py-1 font-bold text-foreground border border-line">
                          {LEAVE_TYPE_LABEL[r.leaveType]}
                        </span>
                        <span className="font-semibold text-muted">
                          📅 {formatDate(r.startDate)} → {formatDate(r.endDate)}
                        </span>
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 font-extrabold text-brand dark:bg-blue-950/40">
                          {r.days} working day{r.days === 1 ? "" : "s"}
                        </span>
                      </div>

                      {r.remarks && (
                        <p className="text-xs text-foreground bg-surface-muted/60 rounded-xl p-3 border border-line/60">
                          <span className="font-semibold text-muted">Reason given:</span> “{r.remarks}”
                        </p>
                      )}

                      {r.decisionComment && (
                        <p className="text-xs text-brand bg-brand-soft/60 rounded-xl p-3 border border-brand/20">
                          <span className="font-bold">Decision note:</span> {r.decisionComment}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status & Approval Action Panel */}
                  <div className="lg:w-72 shrink-0 space-y-3">
                    <div className="flex items-center justify-between lg:justify-end gap-2">
                      <span className={`pill ${LEAVE_STATUS_TONE[r.status]}`}>
                        {LEAVE_STATUS_LABEL[r.status]}
                      </span>
                      <span className="text-[10px] text-muted font-mono">
                        {r.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {r.status === "pending" ? (
                      <div className="rounded-xl border border-line bg-surface-muted/30 p-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                          Decision Action
                        </p>
                        <DecideLeave requestId={r.id} />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-line bg-surface-muted/20 p-3 text-right text-xs text-muted">
                        <span>Decided on </span>
                        <strong>
                          {r.decidedAt
                            ? r.decidedAt.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
