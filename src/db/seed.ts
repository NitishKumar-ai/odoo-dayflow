/**
 * Demo data. Run with `npm run db:seed` — it clears the tables first.
 */
import "./load-env";
import { validateSeedEnvironment } from "./seed-environment";

// Validate before importing the database client or any seed implementation.
// This keeps an unsafe invocation from opening a connection, let alone deleting data.
const PASSWORD = validateSeedEnvironment(process.env);

type Person = {
  code: string;
  email: string;
  first: string;
  last: string;
  role: "admin" | "employee";
  jobTitle: string;
  department: string;
  joined: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
};

const people: Person[] = [
  { code: "HR001", email: "asha@dayflow.test", first: "Asha", last: "Nair", role: "admin", jobTitle: "HR Manager", department: "People", joined: "2021-04-12", basic: 92000, hra: 36000, allowances: 14000, deductions: 11500 },
  { code: "EMP101", email: "rohan@dayflow.test", first: "Rohan", last: "Mehta", role: "employee", jobTitle: "Backend Engineer", department: "Engineering", joined: "2023-01-09", basic: 78000, hra: 31000, allowances: 9000, deductions: 9800 },
  { code: "EMP102", email: "priya@dayflow.test", first: "Priya", last: "Sharma", role: "employee", jobTitle: "Product Designer", department: "Design", joined: "2022-08-22", basic: 71000, hra: 28000, allowances: 8500, deductions: 8900 },
  { code: "EMP103", email: "daniel@dayflow.test", first: "Daniel", last: "Okoro", role: "employee", jobTitle: "QA Analyst", department: "Engineering", joined: "2024-02-05", basic: 54000, hra: 21000, allowances: 6000, deductions: 6600 },
  { code: "EMP104", email: "mei@dayflow.test", first: "Mei", last: "Tanaka", role: "employee", jobTitle: "Account Executive", department: "Sales", joined: "2023-11-13", basic: 62000, hra: 24000, allowances: 15000, deductions: 7400 },
  { code: "EMP105", email: "sam@dayflow.test", first: "Sam", last: "Whitfield", role: "employee", jobTitle: "Support Lead", department: "Customer Success", joined: "2020-06-01", basic: 66000, hra: 26000, allowances: 7000, deductions: 8100 },
];

function at(dateKey: string, hour: number, minute: number) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d, hour, minute, 0, 0);
}

async function main() {
  const [
    { default: bcrypt },
    { eq },
    { db },
    {
      users,
      employees,
      attendance,
      leaveRequests,
      leaveBalances,
      salaryStructures,
      documents,
      activityLog,
      emailVerificationTokens,
    },
    { toDateKey },
    { deriveStatus },
    { DEFAULT_ENTITLEMENT, countLeaveDays },
  ] = await Promise.all([
    import("bcryptjs"),
    import("drizzle-orm"),
    import("./index"),
    import("./schema"),
    import("../lib/dates"),
    import("../lib/attendance"),
    import("../lib/leave"),
  ]);

  console.log("Clearing existing data…");
  await db.delete(activityLog);
  await db.delete(attendance);
  await db.delete(leaveRequests);
  await db.delete(leaveBalances);
  await db.delete(salaryStructures);
  await db.delete(documents);
  await db.delete(emailVerificationTokens);
  await db.delete(employees);
  await db.delete(users);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const year = new Date().getFullYear();
  const createdIds: { person: Person; employeeId: string }[] = [];

  for (const p of people) {
    const [user] = await db
      .insert(users)
      .values({
        employeeCode: p.code,
        email: p.email,
        passwordHash,
        role: p.role,
        emailVerifiedAt: new Date(),
      })
      .returning({ id: users.id });

    const [emp] = await db
      .insert(employees)
      .values({
        userId: user.id,
        firstName: p.first,
        lastName: p.last,
        phone: "+91 98765 4" + Math.floor(1000 + Math.random() * 8999),
        address: "Bengaluru, Karnataka",
        jobTitle: p.jobTitle,
        department: p.department,
        employmentType: "full_time",
        dateOfJoining: p.joined,
      })
      .returning({ id: employees.id });

    await db.insert(salaryStructures).values({
      employeeId: emp.id,
      effectiveFrom: `${year}-01-01`,
      currency: "INR",
      basic: p.basic.toFixed(2),
      hra: p.hra.toFixed(2),
      allowances: p.allowances.toFixed(2),
      deductions: p.deductions.toFixed(2),
      updatedByUserId: user.id,
    });

    await db.insert(leaveBalances).values([
      { employeeId: emp.id, year, leaveType: "paid", entitledDays: DEFAULT_ENTITLEMENT.paid },
      { employeeId: emp.id, year, leaveType: "sick", entitledDays: DEFAULT_ENTITLEMENT.sick },
    ]);

    await db.insert(documents).values([
      { employeeId: emp.id, name: "Offer letter.pdf", category: "contract", url: "#" },
      { employeeId: emp.id, name: "ID proof.pdf", category: "identity", url: "#" },
    ]);

    createdIds.push({ person: p, employeeId: emp.id });
  }

  // 30 days of attendance history.
  console.log("Generating attendance…");
  const now = new Date();
  for (const { employeeId } of createdIds) {
    for (let back = 30; back >= 0; back--) {
      const d = new Date(now);
      d.setDate(now.getDate() - back);
      const key = toDateKey(d);
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      const roll = Math.random();
      if (roll < 0.06) {
        await db.insert(attendance).values({ employeeId, workDate: key, status: "absent" });
        continue;
      }

      const inHour = 9 + (Math.random() < 0.3 ? 1 : 0);
      const inMin = Math.floor(Math.random() * 50);
      const checkIn = at(key, inHour, inMin);
      const short = roll < 0.14;
      const checkOut = at(key, short ? inHour + 4 : 18, Math.floor(Math.random() * 50));
      const isToday = back === 0;

      await db.insert(attendance).values({
        employeeId,
        workDate: key,
        checkInAt: checkIn,
        checkOutAt: isToday ? null : checkOut,
        status: isToday ? "present" : deriveStatus(checkIn, checkOut),
      });
    }
  }

  // A spread of leave requests, including two still awaiting approval.
  console.log("Generating leave requests…");
  const admin = createdIds[0];
  const plan: {
    who: number;
    type: "paid" | "sick" | "unpaid";
    from: number;
    to: number;
    status: "pending" | "approved" | "rejected";
    remarks: string;
  }[] = [
    { who: 1, type: "paid", from: 7, to: 11, status: "pending", remarks: "Family wedding in Pune." },
    { who: 2, type: "sick", from: 2, to: 3, status: "pending", remarks: "Fever, doctor advised rest." },
    { who: 3, type: "paid", from: -20, to: -18, status: "approved", remarks: "Short break." },
    { who: 4, type: "unpaid", from: -12, to: -10, status: "rejected", remarks: "Personal travel." },
    { who: 5, type: "sick", from: -6, to: -6, status: "approved", remarks: "Migraine." },
  ];

  for (const item of plan) {
    const target = createdIds[item.who];
    const start = new Date(now);
    start.setDate(now.getDate() + item.from);
    const end = new Date(now);
    end.setDate(now.getDate() + item.to);
    const startKey = toDateKey(start);
    const endKey = toDateKey(end);
    const days = countLeaveDays(startKey, endKey);
    if (days === 0) continue;

    await db.insert(leaveRequests).values({
      employeeId: target.employeeId,
      leaveType: item.type,
      startDate: startKey,
      endDate: endKey,
      days,
      remarks: item.remarks,
      status: item.status,
      decisionComment:
        item.status === "approved"
          ? "Approved. Enjoy the break."
          : item.status === "rejected"
            ? "Team is short-staffed that week."
            : "",
      decidedByUserId: item.status === "pending" ? null : (await adminUserId()),
      decidedAt: item.status === "pending" ? null : new Date(),
    });

    await db.insert(activityLog).values({
      employeeId: target.employeeId,
      kind: "leave",
      message: `${item.type} leave ${startKey} – ${endKey} (${item.status})`,
    });
  }

  async function adminUserId() {
    const [row] = await db
      .select({ userId: employees.userId })
      .from(employees)
      .where(eq(employees.id, admin.employeeId))
      .limit(1);
    return row.userId;
  }

  console.log(`\nSeeded ${people.length} users. Password for all accounts: ${PASSWORD}`);
  console.log(`  Admin/HR : ${people[0].email}`);
  console.log(`  Employee : ${people[1].email}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
