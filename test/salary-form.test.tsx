import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const updateSalaryAction = vi.fn();
vi.mock("@/actions/profile", () => ({
  updateSalaryAction: (...args: unknown[]) => updateSalaryAction(...args),
}));

import { SalaryForm } from "@/components/admin/SalaryForm";

const defaults = {
  effectiveFrom: "2026-08-01",
  currency: "INR",
  basic: "50000",
  hra: "20000",
  allowances: "5000",
  deductions: "8000",
};

function renderSalaryForm() {
  return render(<SalaryForm employeeId="employee-42" defaults={defaults} />);
}

describe("SalaryForm", () => {
  beforeEach(() => {
    updateSalaryAction.mockReset();
  });

  it("updates gross and net take-home pay while salary fields are edited", async () => {
    const user = userEvent.setup();
    renderSalaryForm();

    expect(screen.getByText("INR 75,000")).toBeInTheDocument();
    expect(screen.getByText("INR 67,000 / mo")).toBeInTheDocument();

    const basic = screen.getByLabelText(/basic monthly salary/i);
    await user.clear(basic);
    await user.type(basic, "60000");

    const deductions = screen.getByLabelText(/standard deductions/i);
    await user.clear(deductions);
    await user.type(deductions, "10000");

    expect(screen.getByText("INR 85,000")).toBeInTheDocument();
    expect(screen.getByText("INR 75,000 / mo")).toBeInTheDocument();
  });

  it("floors net pay at zero when deductions exceed gross earnings", async () => {
    const user = userEvent.setup();
    renderSalaryForm();

    const deductions = screen.getByLabelText(/standard deductions/i);
    await user.clear(deductions);
    await user.type(deductions, "100000");

    expect(screen.getByText("INR 0 / mo")).toBeInTheDocument();
  });

  it("treats empty and zero-valued salary inputs as zero", async () => {
    const user = userEvent.setup();
    renderSalaryForm();

    for (const label of [
      /basic monthly salary/i,
      /house rent allowance/i,
      /other \/ special allowances/i,
    ]) {
      await user.clear(screen.getByLabelText(label));
    }
    const deductions = screen.getByLabelText(/standard deductions/i);
    await user.clear(deductions);
    await user.type(deductions, "0");

    expect(screen.getByText("INR 0")).toBeInTheDocument();
    expect(screen.getByText("−INR 0")).toBeInTheDocument();
    expect(screen.getByText("INR 0 / mo")).toBeInTheDocument();
  });

  it("uses the edited currency in every compensation preview value", async () => {
    const user = userEvent.setup();
    renderSalaryForm();

    const currency = screen.getByLabelText(/currency/i);
    await user.clear(currency);
    await user.type(currency, "USD");

    expect(screen.getByText("USD 75,000")).toBeInTheDocument();
    expect(screen.getByText("−USD 8,000")).toBeInTheDocument();
    expect(screen.getByText("USD 67,000 / mo")).toBeInTheDocument();
  });

  it("submits the employee and all edited salary fields", async () => {
    updateSalaryAction.mockResolvedValue({ ok: "Salary revision recorded." });
    const user = userEvent.setup();
    renderSalaryForm();

    await user.clear(screen.getByLabelText(/effective from/i));
    await user.type(screen.getByLabelText(/effective from/i), "2026-09-01");
    await user.clear(screen.getByLabelText(/currency/i));
    await user.type(screen.getByLabelText(/currency/i), "USD");
    await user.clear(screen.getByLabelText(/basic monthly salary/i));
    await user.type(screen.getByLabelText(/basic monthly salary/i), "61000");
    await user.clear(screen.getByLabelText(/house rent allowance/i));
    await user.type(screen.getByLabelText(/house rent allowance/i), "21000");
    await user.clear(screen.getByLabelText(/other \/ special allowances/i));
    await user.type(screen.getByLabelText(/other \/ special allowances/i), "7000");
    await user.clear(screen.getByLabelText(/standard deductions/i));
    await user.type(screen.getByLabelText(/standard deductions/i), "9000");

    await user.click(
      screen.getByRole("button", { name: /save salary structure revision/i }),
    );

    expect(await screen.findByText(/salary revision recorded/i)).toBeInTheDocument();
    const formData = updateSalaryAction.mock.calls[0][1] as FormData;
    expect(Object.fromEntries(formData)).toEqual({
      employeeId: "employee-42",
      effectiveFrom: "2026-09-01",
      currency: "USD",
      basic: "61000",
      hra: "21000",
      allowances: "7000",
      deductions: "9000",
    });
  });

  it("shows an action error and preserves every edited value after rejection", async () => {
    updateSalaryAction.mockResolvedValue({ error: "Effective date overlaps a revision." });
    const user = userEvent.setup();
    renderSalaryForm();

    const effectiveFrom = screen.getByLabelText(/effective from/i) as HTMLInputElement;
    const currency = screen.getByLabelText(/currency/i) as HTMLInputElement;
    const allowances = screen.getByLabelText(/other \/ special allowances/i) as HTMLInputElement;

    await user.clear(effectiveFrom);
    await user.type(effectiveFrom, "2026-10-01");
    await user.clear(currency);
    await user.type(currency, "EUR");
    await user.clear(allowances);
    await user.type(allowances, "12500");
    await user.click(
      screen.getByRole("button", { name: /save salary structure revision/i }),
    );

    expect(await screen.findByText(/effective date overlaps/i)).toBeInTheDocument();
    expect(effectiveFrom.value).toBe("2026-10-01");
    expect(currency.value).toBe("EUR");
    expect(allowances.value).toBe("12500");
    expect(screen.getByText("EUR 82,500")).toBeInTheDocument();
  });
});
