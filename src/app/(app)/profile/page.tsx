import { requireUser } from "@/lib/auth";
import {
  getEmployeeDetail,
  getCurrentSalary,
  getDocuments,
} from "@/lib/employee-queries";
import { formatDate } from "@/lib/dates";
import { formatMoney, gross, net } from "@/lib/money";
import { Avatar } from "@/components/Avatar";
import { ProfileForm } from "@/components/ProfileForm";

const EMPLOYMENT_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  intern: "Intern",
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm">{value || <span className="text-muted">—</span>}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  const user = await requireUser();
  const detail = await getEmployeeDetail(user.employeeId);
  if (!detail) return <p className="text-muted">Profile not found.</p>;

  const salary = await getCurrentSalary(user.employeeId);
  const docs = await getDocuments(user.employeeId);
  const fullName = `${detail.firstName} ${detail.lastName}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={fullName} photoUrl={detail.photoUrl} size={64} />
        <div>
          <h1 className="text-2xl font-semibold">{fullName}</h1>
          <p className="text-sm text-muted">
            {detail.jobTitle || "Role not set"} · {detail.department || "No department"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Personal details
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Employee ID" value={detail.employeeCode} />
            <Field label="Email" value={detail.email} />
            <Field label="Phone" value={detail.phone} />
            <Field label="Date of birth" value={detail.dateOfBirth ? formatDate(detail.dateOfBirth) : ""} />
            <div className="sm:col-span-2">
              <Field label="Address" value={detail.address} />
            </div>
          </dl>

          <h2 className="mt-7 text-sm font-semibold uppercase tracking-wide text-muted">
            Job details
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Job title" value={detail.jobTitle} />
            <Field label="Department" value={detail.department} />
            <Field
              label="Employment type"
              value={EMPLOYMENT_LABEL[detail.employmentType] ?? detail.employmentType}
            />
            <Field
              label="Joined"
              value={detail.dateOfJoining ? formatDate(detail.dateOfJoining) : ""}
            />
            <Field label="Access level" value={detail.role === "admin" ? "HR / Admin" : "Employee"} />
          </dl>
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Salary structure
            </h2>
            {salary ? (
              <>
                <p className="mt-3 text-2xl font-semibold tabular-nums">
                  {formatMoney(net(salary), salary.currency)}
                  <span className="text-sm font-normal text-muted"> net / month</span>
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  {[
                    ["Basic", salary.basic],
                    ["HRA", salary.hra],
                    ["Allowances", salary.allowances],
                  ].map(([label, amount]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-muted">{label}</dt>
                      <dd className="tabular-nums">
                        {formatMoney(Number(amount), salary.currency)}
                      </dd>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-line pt-2">
                    <dt className="text-muted">Gross</dt>
                    <dd className="tabular-nums">{formatMoney(gross(salary), salary.currency)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Deductions</dt>
                    <dd className="tabular-nums">
                      −{formatMoney(Number(salary.deductions), salary.currency)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted">
                  Effective {formatDate(salary.effectiveFrom)} · read-only
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">No salary structure on record yet.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Documents
            </h2>
            {docs.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No documents uploaded.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between text-sm">
                    <span>{d.name}</span>
                    <span className="text-xs text-muted">{d.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Edit my details
        </h2>
        <div className="mt-4 max-w-lg">
          <ProfileForm
            phone={detail.phone}
            address={detail.address}
            photoUrl={detail.photoUrl ?? ""}
          />
        </div>
      </section>
    </div>
  );
}
