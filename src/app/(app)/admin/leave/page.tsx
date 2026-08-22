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

const TABS: { key: LeaveStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default async function AdminLeavePage({ searchParams }: PageProps<"/admin/leave">) {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leave approvals</h1>
        <p className="text-sm text-muted">
          {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
        </p>
      </div>

      <nav className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/leave?status=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.key
                ? "bg-brand-soft text-brand"
                : "text-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-muted">Nothing here right now.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => {
            const name = `${r.firstName} ${r.lastName}`.trim();
            return (
              <li key={r.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={name} photoUrl={r.photoUrl} size={40} />
                    <div>
                      <Link
                        href={`/admin/employees/${r.employeeId}`}
                        className="font-medium hover:underline"
                      >
                        {name}
                      </Link>
                      <p className="text-xs text-muted">
                        {r.employeeCode} · {r.department || "No department"}
                      </p>
                      <p className="mt-2 text-sm">
                        <span className="font-medium">{LEAVE_TYPE_LABEL[r.leaveType]}</span> ·{" "}
                        {formatDate(r.startDate)} – {formatDate(r.endDate)} · {r.days} day
                        {r.days === 1 ? "" : "s"}
                      </p>
                      {r.remarks ? (
                        <p className="mt-1 text-sm text-muted">“{r.remarks}”</p>
                      ) : null}
                      {r.decisionComment ? (
                        <p className="mt-1 text-sm text-muted">HR note: {r.decisionComment}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-[260px] space-y-2">
                    <div className="flex justify-end">
                      <span className={`pill ${LEAVE_STATUS_TONE[r.status]}`}>
                        {LEAVE_STATUS_LABEL[r.status]}
                      </span>
                    </div>
                    {r.status === "pending" ? (
                      <DecideLeave requestId={r.id} />
                    ) : (
                      <p className="text-right text-xs text-muted">
                        Decided{" "}
                        {r.decidedAt
                          ? r.decidedAt.toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
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
