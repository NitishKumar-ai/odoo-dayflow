import { desc, eq } from "drizzle-orm";
import { db, leaveRequests } from "@/db";
import { requireUser } from "@/lib/auth";
import { leaveSummary } from "@/lib/leave-queries";
import {
  LEAVE_STATUS_LABEL,
  LEAVE_STATUS_TONE,
  LEAVE_TYPE_LABEL,
} from "@/lib/leave";
import { today, formatDate } from "@/lib/dates";
import { LeaveForm } from "@/components/LeaveForm";
import { LeaveBalanceCard } from "@/components/LeaveBalanceCard";
import { WithdrawLeave } from "@/components/WithdrawLeave";
import {
  IconLeave,
  IconClock,
  IconSparkles,
  IconCheckCircle,
  IconAlertCircle,
  IconPlus,
} from "@/components/Icons";

export default async function LeavePage() {
  const user = await requireUser();
  const key = today();
  const year = Number(key.slice(0, 4));

  const balances = await leaveSummary(user.employeeId, year);
  const requests = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.employeeId, user.employeeId))
    .orderBy(desc(leaveRequests.createdAt));

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-8">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Leave & Time Off
          </h1>
          <p className="mt-1 text-sm text-muted">
            Track your annual entitlements, apply for time off, and monitor request approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="pill bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300">
            {pendingCount} Pending Request{pendingCount === 1 ? "" : "s"}
          </span>
          <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300">
            {approvedCount} Approved
          </span>
        </div>
      </div>

      {/* Leave Balance Quotas Grid */}
      <section className="grid gap-4 sm:grid-cols-3">
        {balances.map((b) => (
          <LeaveBalanceCard
            key={b.leaveType}
            type={b.leaveType}
            entitled={b.entitled}
            used={b.used}
            left={b.left}
          />
        ))}
        <div className="card p-5 bg-purple-50/50 border-purple-200/80 dark:bg-purple-950/20 dark:border-purple-800/40">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Unpaid Leave
              </span>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
                Flexible
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-surface shadow-xs text-purple-600 dark:text-purple-400">
              <IconSparkles size={20} />
            </div>
          </div>
          <p className="mt-4 text-xs text-muted">
            Unlimited quota with prior HR manager review and approval.
          </p>
        </div>
      </section>

      {/* Application Form and History Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leave Application Card */}
        <section className="card p-6">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand">
              <IconPlus size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Apply for Leave</h2>
              <p className="text-xs text-muted">Submit request for HR review</p>
            </div>
          </div>

          <div className="mt-5">
            <LeaveForm minDate={key} balances={balances} />
          </div>
        </section>

        {/* Requests History List */}
        <section className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-foreground">My Leave History</h2>
              <p className="text-xs text-muted">All past and upcoming time-off applications</p>
            </div>
            <span className="text-xs font-semibold text-muted">
              {requests.length} total application{requests.length === 1 ? "" : "s"}
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted">
              <IconLeave size={32} className="mx-auto mb-2 text-muted/50" />
              <p className="font-semibold text-foreground">No leave applications yet</p>
              <p className="mt-1 text-xs text-muted">
                Use the application form on the left to submit your first time-off request.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="p-6 transition-colors hover:bg-surface-muted/30">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">
                          {LEAVE_TYPE_LABEL[r.leaveType]}
                        </span>
                        <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-bold tabular-nums text-muted">
                          {r.days} working day{r.days === 1 ? "" : "s"}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-muted">
                        📅 {formatDate(r.startDate)} → {formatDate(r.endDate)}
                      </p>

                      {r.remarks && (
                        <p className="text-xs text-foreground bg-surface-muted/60 rounded-lg p-2 mt-2 border border-line/60">
                          <span className="font-semibold text-muted">Reason:</span> “{r.remarks}”
                        </p>
                      )}

                      {r.decisionComment && (
                        <div className="flex items-start gap-1.5 text-xs text-brand bg-brand-soft/60 rounded-lg p-2 mt-2 border border-brand/20">
                          <IconCheckCircle size={14} className="mt-0.5 shrink-0" />
                          <span>
                            <strong>HR Decision Note:</strong> {r.decisionComment}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                      <span className={`pill ${LEAVE_STATUS_TONE[r.status]}`}>
                        {LEAVE_STATUS_LABEL[r.status]}
                      </span>

                      {r.status === "pending" && (
                        <WithdrawLeave requestId={r.id} />
                      )}

                      <span className="text-[10px] text-muted font-mono">
                        Submitted {r.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
