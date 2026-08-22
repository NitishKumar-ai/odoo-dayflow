import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listEmployees } from "@/lib/employee-queries";
import { Avatar } from "@/components/Avatar";
import {
  IconEmployees,
  IconSearch,
  IconArrowUpRight,
} from "@/components/Icons";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminEmployeesPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const rows = await listEmployees(q);

  const activeCount = rows.filter((r) => r.isActive).length;
  const adminCount = rows.filter((r) => r.role === "admin").length;

  return (
    <div className="space-y-8">
      {/* Title & Top Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Employee Directory
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage company employees, job roles, departments, system permissions, and compensation profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-600/20 font-bold">
            {activeCount} Active
          </span>
          <span className="pill bg-purple-50 text-purple-700 ring-purple-600/20 font-bold">
            {adminCount} Administrators
          </span>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <form className="flex items-center gap-2 w-full sm:w-96">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
              <IconSearch size={16} />
            </span>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, employee code, or department..."
              className="input pl-10 text-xs"
            />
          </div>
          <button type="submit" className="btn-secondary btn-sm text-xs font-bold shrink-0">
            Search
          </button>
          {q && (
            <Link href="/admin/employees" className="text-xs text-brand font-semibold hover:underline shrink-0">
              Clear
            </Link>
          )}
        </form>

        <span className="text-xs font-semibold text-muted">
          Showing {rows.length} team member{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Employees Table Grid */}
      <section className="card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-surface-muted/60">
              <tr>
                <th className="th">Employee Details</th>
                <th className="th">Designation</th>
                <th className="th">Department</th>
                <th className="th">Access Role</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const name = `${r.firstName} ${r.lastName}`.trim();
                return (
                  <tr
                    key={r.id}
                    className={`transition-colors hover:bg-surface-muted/30 ${
                      r.isActive ? "" : "opacity-60 bg-surface-muted/10"
                    }`}
                  >
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} photoUrl={r.photoUrl} size={38} />
                        <div>
                          <Link
                            href={`/admin/employees/${r.id}`}
                            className="font-bold text-foreground hover:text-brand hover:underline"
                          >
                            {name}
                          </Link>
                          <p className="text-xs text-muted">
                            <span className="font-mono">{r.employeeCode}</span> · {r.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="td font-medium text-foreground text-xs">
                      {r.jobTitle || <span className="text-muted/60">—</span>}
                    </td>

                    <td className="td text-xs font-semibold text-muted">
                      {r.department || <span className="text-muted/60">—</span>}
                    </td>

                    <td className="td">
                      {r.role === "admin" ? (
                        <span className="pill bg-purple-50 text-purple-700 ring-purple-600/20 text-[11px] font-bold">
                          🛡️ Admin
                        </span>
                      ) : (
                        <span className="pill bg-surface-muted text-muted ring-line text-[11px] font-medium">
                          👤 Employee
                        </span>
                      )}
                    </td>

                    <td className="td">
                      {r.isActive ? (
                        <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-600/20 text-[11px] font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="pill bg-rose-50 text-rose-700 ring-rose-600/20 text-[11px] font-bold">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="td text-right">
                      <div className="flex items-center justify-end gap-2">
                        {r.pendingLeave > 0 && (
                          <span className="pill bg-amber-50 text-amber-700 ring-amber-600/20 text-[10px] font-bold">
                            {r.pendingLeave} leave pending
                          </span>
                        )}
                        <Link
                          href={`/admin/employees/${r.id}`}
                          className="btn-secondary btn-sm text-xs font-bold"
                        >
                          <span>Manage</span>
                          <IconArrowUpRight size={13} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td className="td text-center text-muted p-12" colSpan={6}>
                    <IconEmployees size={36} className="mx-auto mb-2 text-muted/50" />
                    <p className="font-bold text-foreground">No employees found</p>
                    <p className="mt-1 text-xs text-muted">
                      No results matched query “{q}”. Try a different name or employee code.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
