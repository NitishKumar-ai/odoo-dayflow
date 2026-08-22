import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { StatCard } from "@/components/StatCard";
import { LeaveBalanceCard } from "@/components/LeaveBalanceCard";
import { SalaryCard } from "@/components/SalaryCard";
import type { SalaryStructure } from "@/db";

function salary(overrides: Partial<SalaryStructure> = {}): SalaryStructure {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    employeeId: "00000000-0000-0000-0000-000000000002",
    effectiveFrom: "2026-01-01",
    currency: "INR",
    basic: "50000.00",
    hra: "25000.00",
    allowances: "25000.00",
    deductions: "10000.00",
    updatedByUserId: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  } as SalaryStructure;
}

describe("StatCard", () => {
  it("renders a plain card with no link when no href is given", () => {
    const { container } = render(<StatCard title="Present days" value={18} />);

    expect(screen.getByText("18")).toBeInTheDocument();
    expect(container.querySelector("a")).toBeNull();
  });

  it("wraps the card in a link when an href is given", () => {
    render(<StatCard title="Pending approvals" value={3} href="/admin/leave" />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/admin/leave");
  });

  it("marks an upward trend distinctly from a downward one", () => {
    const { unmount } = render(
      <StatCard title="Attendance" value="92%" trend={{ value: "4%", isPositive: true }} />,
    );
    expect(screen.getByText(/↑ 4%/)).toBeInTheDocument();
    unmount();

    render(<StatCard title="Attendance" value="81%" trend={{ value: "6%" }} />);
    expect(screen.getByText(/↓ 6%/)).toBeInTheDocument();
  });

  it("omits the footer row entirely with neither subtitle nor trend", () => {
    render(<StatCard title="Headcount" value={12} />);

    expect(screen.queryByText(/↑|↓/)).not.toBeInTheDocument();
  });
});

describe("LeaveBalanceCard", () => {
  it("reports the remaining share of the entitlement", () => {
    render(<LeaveBalanceCard type="paid" entitled={20} used={5} left={15} />);

    expect(screen.getByText("Paid leave")).toBeInTheDocument();
    expect(screen.getByText("75% available")).toBeInTheDocument();
    expect(screen.getByText("5 days used this year")).toBeInTheDocument();
  });

  it("does not divide by a zero entitlement", () => {
    render(<LeaveBalanceCard type="unpaid" entitled={0} used={0} left={0} />);

    expect(screen.getByText("100% available")).toBeInTheDocument();
  });

  it("clamps an over-granted balance to 100 percent", () => {
    render(<LeaveBalanceCard type="sick" entitled={10} used={0} left={14} />);

    expect(screen.getByText("100% available")).toBeInTheDocument();
  });
});

describe("SalaryCard", () => {
  it("breaks gross pay into component percentages", () => {
    render(<SalaryCard salary={salary()} />);

    expect(screen.getByText("Basic (50%)")).toBeInTheDocument();
    expect(screen.getByText("HRA (25%)")).toBeInTheDocument();
    expect(screen.getByText("Allowances (25%)")).toBeInTheDocument();
  });

  it("shows net pay as gross minus deductions", () => {
    render(<SalaryCard salary={salary()} />);

    const netRow = screen.getByText("Net Take-Home Pay").closest("div");
    expect(within(netRow as HTMLElement).getByText(/90,000/)).toBeInTheDocument();
  });

  it("does not divide by zero when every earning component is zero", () => {
    render(
      <SalaryCard salary={salary({ basic: "0", hra: "0", allowances: "0", deductions: "0" })} />,
    );

    expect(screen.getByText("Basic (0%)")).toBeInTheDocument();
    expect(screen.getByText("HRA (0%)")).toBeInTheDocument();
    expect(screen.getByText("Allowances (0%)")).toBeInTheDocument();
  });

  it("hides the HR revision notice when the caller opts out", () => {
    const { unmount } = render(<SalaryCard salary={salary()} />);
    expect(screen.getByText(/versioned revision trail/i)).toBeInTheDocument();
    unmount();

    render(<SalaryCard salary={salary()} showHistoryNotice={false} />);
    expect(screen.queryByText(/versioned revision trail/i)).not.toBeInTheDocument();
  });
});
