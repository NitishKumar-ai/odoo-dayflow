import "./load-env";

import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { db } from "./index";
import { users, employees, leaveBalances } from "./schema";
import { toDateKey } from "../lib/dates";
import { DEFAULT_ENTITLEMENT } from "../lib/leave";
import crypto from "node:crypto";

/**
 * Production initial admin provisioner script.
 * Provisions an initial HR/Admin account without loading demo seed data.
 * Usage:
 *   ADMIN_EMAIL="admin@company.com" ADMIN_PASSWORD="SecurePassword123!" ADMIN_CODE="ADM001" npm run db:create-admin
 */
async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@dayflow.internal").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex");
  const code = (process.env.ADMIN_CODE || "ADM001").trim().toUpperCase();
  const firstName = process.env.ADMIN_FIRST_NAME || "System";
  const lastName = process.env.ADMIN_LAST_NAME || "Administrator";

  console.log(`Checking for existing admin/user matching email "${email}" or code "${code}"...`);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.employeeCode, code)))
    .limit(1);

  if (existing.length > 0) {
    console.error(`Error: User with email "${email}" or employee code "${code}" already exists.`);
    process.exit(1);
  }

  console.log("Creating production admin account...");
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();
  const year = now.getFullYear();

  const [user] = await db
    .insert(users)
    .values({
      employeeCode: code,
      email,
      passwordHash,
      role: "admin",
      emailVerifiedAt: now,
      isActive: true,
    })
    .returning({ id: users.id });

  const [emp] = await db
    .insert(employees)
    .values({
      userId: user.id,
      firstName,
      lastName,
      jobTitle: "HR Administrator",
      department: "Administration",
      employmentType: "full_time",
      dateOfJoining: toDateKey(now),
    })
    .returning({ id: employees.id });

  await db.insert(leaveBalances).values([
    { employeeId: emp.id, year, leaveType: "paid", entitledDays: DEFAULT_ENTITLEMENT.paid },
    { employeeId: emp.id, year, leaveType: "sick", entitledDays: DEFAULT_ENTITLEMENT.sick },
  ]);

  console.log("\n=========================================");
  console.log("Production Admin Account Created!");
  console.log("=========================================");
  console.log(`  Employee Code : ${code}`);
  console.log(`  Email         : ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`  Generated Pass: ${password}`);
    console.log("  (Save this password securely immediately!)");
  } else {
    console.log("  Password      : [Set via ADMIN_PASSWORD environment variable]");
  }
  console.log("=========================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to create admin user:", err);
  process.exit(1);
});
