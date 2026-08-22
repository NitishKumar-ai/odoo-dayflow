"use client";

import { useActionState } from "react";
import { adminUpdateEmployeeAction, type ActionResult } from "@/actions/profile";
import { SubmitButton } from "@/components/SubmitButton";
import { Alert } from "@/components/Alert";
import { useFields } from "@/components/useFields";

const initial: ActionResult = {};

export type EmployeeEditValues = {
  employeeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  jobTitle: string;
  department: string;
  employmentType: string;
  dateOfJoining: string;
  dateOfBirth: string;
  role: "admin" | "employee";
  isActive: boolean;
};

export function EmployeeEditForm({ values }: { values: EmployeeEditValues }) {
  const [state, action] = useActionState(adminUpdateEmployeeAction, initial);
  const { field } = useFields({
    firstName: values.firstName,
    lastName: values.lastName,
    phone: values.phone,
    address: values.address,
    jobTitle: values.jobTitle,
    department: values.department,
    employmentType: values.employmentType,
    dateOfJoining: values.dateOfJoining,
    dateOfBirth: values.dateOfBirth,
    role: values.role,
    isActive: values.isActive ? "true" : "false",
  });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="employeeId" value={values.employeeId} />
      {state.error ? <Alert>{state.error}</Alert> : null}
      {state.ok ? <Alert tone="success">{state.ok}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="firstName">First name</label>
          <input {...field("firstName")} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="lastName">Last name</label>
          <input {...field("lastName")} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input {...field("phone")} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="dateOfBirth">Date of birth</label>
          <input {...field("dateOfBirth")} type="date" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="address">Address</label>
          <textarea {...field("address")} rows={2} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="jobTitle">Job title</label>
          <input {...field("jobTitle")} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="department">Department</label>
          <input {...field("department")} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="employmentType">Employment type</label>
          <select {...field("employmentType")} className="input">
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="dateOfJoining">Date of joining</label>
          <input {...field("dateOfJoining")} type="date" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="role">Access level</label>
          <select {...field("role")} className="input">
            <option value="employee">Employee</option>
            <option value="admin">HR / Admin</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="isActive">Account status</label>
          <select {...field("isActive")} className="input">
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </select>
        </div>
      </div>

      <SubmitButton pendingLabel="Saving…">Save employee details</SubmitButton>
    </form>
  );
}
