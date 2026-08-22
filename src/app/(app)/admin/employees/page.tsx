import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listEmployees } from "@/lib/employee-queries";
import { Avatar } from "@/components/Avatar";

export default async function AdminEmployeesPage({
  searchParams,
}: PageProps<"/admin/employees">) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const rows = await listEmployees(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted">
            {rows.length} {rows.length === 1 ? "person" : "people"}
            {q ? ` matching “${q}”` : ""}
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, ID, department…"
            className="input w-64"
          />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
      </div>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-surface-muted">
              <tr>
                <th className="th">Employee</th>
                <th className="th">Role</th>
                <th className="th">Department</th>
                <th className="th">Access</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const name = `${r.firstName} ${r.lastName}`.trim();
                return (
                  <tr key={r.id} className="hover:bg-surface-muted/60">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} photoUrl={r.photoUrl} size={36} />
                        <div>
                          <p className="font-medium">{name}</p>
                          <p className="text-xs text-muted">
                            {r.employeeCode} · {r.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="td text-muted">{r.jobTitle || "—"}</td>
                    <td className="td text-muted">{r.department || "—"}</td>
                    <td className="td">
                      {r.role === "admin" ? (
                        <span className="pill bg-brand-soft text-brand ring-brand/20">HR / Admin</span>
                      ) : (
                        <span className="text-muted">Employee</span>
                      )}
                    </td>
                    <td className="td">
                      {r.isActive ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                      ) : (
                        <span className="text-muted">Deactivated</span>
                      )}
                    </td>
                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.pendingLeave > 0 ? (
                          <span className="pill bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20">
                            {r.pendingLeave} pending
                          </span>
                        ) : null}
                        <Link href={`/admin/employees/${r.id}`} className="btn-secondary">
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 ? (
                <tr>
                  <td className="td text-muted" colSpan={6}>
                    No employees match that search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
