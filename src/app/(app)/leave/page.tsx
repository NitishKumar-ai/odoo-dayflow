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
import { WithdrawLeave } from "@/components/WithdrawLeave";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leave & time off</h1>
        <p className="text-sm text-muted">Apply for time off and track where each request stands.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {balances.map((b) => (
          <div key={b.leaveType} className="card p-5">
            <p className="text-sm text-muted">{LEAVE_TYPE_LABEL[b.leaveType]}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {b.left}
              <span className="text-base font-normal text-muted"> / {b.entitled} days left</span>
            </p>
            <p className="mt-1 text-xs text-muted">{b.used} committed this year</p>
          </div>
        ))}
        <div className="card p-5">
          <p className="text-sm text-muted">Unpaid leave</p>
          <p className="mt-1 text-3xl font-semibold">No cap</p>
          <p className="mt-1 text-xs text-muted">Still needs HR approval</p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Apply for leave
          </h2>
          <div className="mt-4">
            <LeaveForm minDate={key} />
          </div>
        </section>

        <section className="card overflow-hidden lg:col-span-2">
          <h2 className="border-b border-line px-5 py-3 font-medium">My requests</h2>
          {requests.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">You have not requested leave yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {requests.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {LEAVE_TYPE_LABEL[r.leaveType]} · {r.days} day{r.days === 1 ? "" : "s"}
                      </p>
                      <p className="text-sm text-muted">
                        {formatDate(r.startDate)} – {formatDate(r.endDate)}
                      </p>
                      {r.remarks ? <p className="mt-1 text-sm">{r.remarks}</p> : null}
                      {r.decisionComment ? (
                        <p className="mt-1 text-sm text-muted">
                          HR: {r.decisionComment}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`pill ${LEAVE_STATUS_TONE[r.status]}`}>
                        {LEAVE_STATUS_LABEL[r.status]}
                      </span>
                      {r.status === "pending" ? <WithdrawLeave requestId={r.id} /> : null}
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
