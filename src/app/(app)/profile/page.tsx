import { requireUser } from "@/lib/auth";
import {
  getEmployeeDetail,
  getCurrentSalary,
  getDocuments,
} from "@/lib/employee-queries";
import { formatDate } from "@/lib/dates";
import { Avatar } from "@/components/Avatar";
import { ProfileForm } from "@/components/ProfileForm";
import { SalaryCard } from "@/components/SalaryCard";
import {
  IconUser,
  IconBriefcase,
  IconFileText,
} from "@/components/Icons";

const EMPLOYMENT_LABEL: Record<string, string> = {
  full_time: "Full-Time Permanent",
  part_time: "Part-Time",
  contract: "Independent Contractor",
  intern: "Intern / Trainee",
};

export default async function ProfilePage() {
  const user = await requireUser();
  const detail = await getEmployeeDetail(user.employeeId);
  if (!detail) return <p className="text-muted">Profile not found.</p>;

  const salary = await getCurrentSalary(user.employeeId);
  const docs = await getDocuments(user.employeeId);
  const fullName = `${detail.firstName} ${detail.lastName}`.trim();

  return (
    <div className="space-y-8">
      {/* Hero Profile Banner */}
      <div className="card overflow-hidden border-brand/20">
        <div className="h-32 bg-linear-to-r from-brand via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="p-6 sm:p-8 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="ring-4 ring-surface rounded-2xl overflow-hidden shadow-lg bg-surface shrink-0">
              <Avatar name={fullName} photoUrl={detail.photoUrl} size={96} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {fullName}
                </h1>
                <span className="pill bg-brand-soft text-brand ring-brand/20 font-mono text-xs">
                  {detail.employeeCode}
                </span>
              </div>
              <p className="text-sm text-muted font-medium">
                {detail.jobTitle || "Role not set"} · {detail.department || "General"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`pill ${
                detail.role === "admin"
                  ? "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-300"
                  : "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300"
              } font-bold`}
            >
              {detail.role === "admin" ? "🛡️ HR Administrator" : "👤 Employee"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Personal & Employment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employment & Role Information */}
          <section className="card p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-line pb-4 mb-5">
              <IconBriefcase size={18} className="text-brand" />
              <h2 className="text-base font-bold text-foreground">Employment & Role Information</h2>
            </div>

            <dl className="grid gap-5 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">Job Title</dt>
                <dd className="mt-1 font-semibold text-foreground">{detail.jobTitle || "—"}</dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">Department</dt>
                <dd className="mt-1 font-semibold text-foreground">{detail.department || "—"}</dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">Employment Type</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {EMPLOYMENT_LABEL[detail.employmentType] ?? detail.employmentType}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">Date of Joining</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {detail.dateOfJoining ? formatDate(detail.dateOfJoining) : "—"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">Company Email</dt>
                <dd className="mt-1 font-semibold text-foreground font-mono text-xs">{detail.email}</dd>
              </div>

              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">System Role</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {detail.role === "admin" ? "HR Administrator" : "Standard Employee"}
                </dd>
              </div>
            </dl>
          </section>

          {/* Contact Details & Edit Form */}
          <section className="card p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-line pb-4 mb-5">
              <IconUser size={18} className="text-brand" />
              <h2 className="text-base font-bold text-foreground">Personal & Contact Preferences</h2>
            </div>

            <ProfileForm
              phone={detail.phone}
              address={detail.address}
              photoUrl={detail.photoUrl ?? ""}
            />
          </section>
        </div>

        {/* Right Column: Salary & Documents */}
        <div className="space-y-6">
          {/* Salary Breakdown snippet */}
          {salary ? (
            <SalaryCard salary={salary} showHistoryNotice={false} />
          ) : (
            <div className="card p-6 text-center text-muted">
              <p className="text-xs">No salary structure active.</p>
            </div>
          )}

          {/* Documents Card */}
          <section className="card p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-line pb-4 mb-4">
              <IconFileText size={18} className="text-brand" />
              <h2 className="text-base font-bold text-foreground">Uploaded Documents</h2>
            </div>

            {docs.length === 0 ? (
              <p className="text-xs text-muted">
                No official employee documents uploaded yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {docs.map((d: (typeof docs)[number]) => (
                  <li key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{d.name}</span>
                    <span className="pill bg-surface-muted text-muted font-mono">{d.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
