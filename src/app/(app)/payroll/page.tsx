import { requireUser } from "@/lib/auth";
import { getCurrentSalary, getSalaryHistory } from "@/lib/employee-queries";
import { formatDate } from "@/lib/dates";
import { formatMoney, gross, net } from "@/lib/money";

export default async function PayrollPage() {
  const user = await requireUser();
  const current = await getCurrentSalary(user.employeeId);
  const history = await getSalaryHistory(user.employeeId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My salary</h1>
        <p className="text-sm text-muted">
          Read-only. HR maintains your salary structure — contact them about changes.
        </p>
      </div>

      {!current ? (
        <div className="card p-6">
          <p className="text-sm text-muted">No salary structure has been recorded for you yet.</p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <p className="text-sm text-muted">Gross monthly</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {formatMoney(gross(current), current.currency)}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-muted">Deductions</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                −{formatMoney(Number(current.deductions), current.currency)}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-sm text-muted">Net monthly</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {formatMoney(net(current), current.currency)}
              </p>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Breakdown · effective {formatDate(current.effectiveFrom)}
            </h2>
            <dl className="mt-4 max-w-md space-y-2 text-sm">
              {[
                ["Basic", current.basic],
                ["House rent allowance", current.hra],
                ["Other allowances", current.allowances],
              ].map(([label, amount]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-muted">{label}</dt>
                  <dd className="tabular-nums">{formatMoney(Number(amount), current.currency)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-line pt-2 font-medium">
                <dt>Gross</dt>
                <dd className="tabular-nums">{formatMoney(gross(current), current.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Deductions</dt>
                <dd className="tabular-nums">
                  −{formatMoney(Number(current.deductions), current.currency)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-medium">
                <dt>Net pay</dt>
                <dd className="tabular-nums">{formatMoney(net(current), current.currency)}</dd>
              </div>
            </dl>
          </section>

          {history.length > 1 ? (
            <section className="card overflow-hidden">
              <h2 className="border-b border-line px-5 py-3 font-medium">Revision history</h2>
              <table className="w-full">
                <thead className="bg-surface-muted">
                  <tr>
                    <th className="th">Effective from</th>
                    <th className="th">Gross</th>
                    <th className="th">Deductions</th>
                    <th className="th">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="td">{formatDate(h.effectiveFrom)}</td>
                      <td className="td tabular-nums">{formatMoney(gross(h), h.currency)}</td>
                      <td className="td tabular-nums">
                        {formatMoney(Number(h.deductions), h.currency)}
                      </td>
                      <td className="td tabular-nums">{formatMoney(net(h), h.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
