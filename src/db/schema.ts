import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  date,
  integer,
  numeric,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "employee"]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "half_day",
  "leave",
]);
export const leaveTypeEnum = pgEnum("leave_type", ["paid", "sick", "unpaid"]);
export const leaveStatusEnum = pgEnum("leave_status", [
  "pending",
  "approved",
  "rejected",
]);

/** Auth identity. Every user also has exactly one employee profile. */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeCode: text("employee_code").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("employee"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  token: text("token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

/** Profile + job details. Employee may edit only address / phone / photo. */
export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  photoUrl: text("photo_url"),
  dateOfBirth: date("date_of_birth"),
  jobTitle: text("job_title").notNull().default(""),
  department: text("department").notNull().default(""),
  employmentType: text("employment_type").notNull().default("full_time"),
  dateOfJoining: date("date_of_joining"),
  managerId: uuid("manager_id"),
});

/** Salary structure is versioned so admin edits keep an audit trail. */
export const salaryStructures = pgTable(
  "salary_structures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    effectiveFrom: date("effective_from").notNull(),
    currency: text("currency").notNull().default("INR"),
    basic: numeric("basic", { precision: 12, scale: 2 }).notNull().default("0"),
    hra: numeric("hra", { precision: 12, scale: 2 }).notNull().default("0"),
    allowances: numeric("allowances", { precision: 12, scale: 2 }).notNull().default("0"),
    deductions: numeric("deductions", { precision: 12, scale: 2 }).notNull().default("0"),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("salary_employee_effective").on(t.employeeId, t.effectiveFrom)],
);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("other"),
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    workDate: date("work_date").notNull(),
    checkInAt: timestamp("check_in_at", { withTimezone: true }),
    checkOutAt: timestamp("check_out_at", { withTimezone: true }),
    status: attendanceStatusEnum("status").notNull().default("absent"),
    /** true when an admin set the status by hand, so auto-derivation stops overwriting it */
    isManual: boolean("is_manual").notNull().default(false),
    note: text("note").notNull().default(""),
  },
  (t) => [
    unique("attendance_employee_date").on(t.employeeId, t.workDate),
    index("attendance_date_idx").on(t.workDate),
  ],
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    leaveType: leaveTypeEnum("leave_type").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    days: integer("days").notNull(),
    remarks: text("remarks").notNull().default(""),
    status: leaveStatusEnum("status").notNull().default("pending"),
    decisionComment: text("decision_comment").notNull().default(""),
    decidedByUserId: uuid("decided_by_user_id").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leave_employee_idx").on(t.employeeId, t.status)],
);

/** Entitlement per employee per calendar year. Unpaid leave is not tracked here. */
export const leaveBalances = pgTable(
  "leave_balances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    leaveType: leaveTypeEnum("leave_type").notNull(),
    entitledDays: integer("entitled_days").notNull().default(0),
  },
  (t) => [unique("balance_employee_year_type").on(t.employeeId, t.year, t.leaveType)],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_employee_idx").on(t.employeeId, t.createdAt)],
);

export const usersRelations = relations(users, ({ one }) => ({
  employee: one(employees, { fields: [users.id], references: [employees.userId] }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, { fields: [employees.userId], references: [users.id] }),
  attendance: many(attendance),
  leaveRequests: many(leaveRequests),
  salaryStructures: many(salaryStructures),
  documents: many(documents),
}));

export type User = typeof users.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type SalaryStructure = typeof salaryStructures.$inferSelect;
