import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The real action is a server action that imports the database; replace it.
const applyLeaveAction = vi.fn();
vi.mock("@/actions/leave", () => ({
  applyLeaveAction: (...args: unknown[]) => applyLeaveAction(...args),
}));

import { LeaveForm } from "@/components/LeaveForm";

/** Both date fields are `required`, so the form will not submit until they are set. */
function fillDates(start = "2026-09-07", end = "2026-09-09") {
  fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: start } });
  fireEvent.change(screen.getByLabelText(/^to$/i), { target: { value: end } });
}

describe("LeaveForm", () => {
  beforeEach(() => {
    applyLeaveAction.mockReset();
  });

  it("shows the error the action returns", async () => {
    applyLeaveAction.mockResolvedValue({ error: "That exceeds your paid leave balance." });
    const user = userEvent.setup();

    render(<LeaveForm minDate="2026-08-22" />);
    fillDates();
    await user.click(screen.getByRole("button", { name: /submit request/i }));

    expect(applyLeaveAction).toHaveBeenCalled();
    expect(
      await screen.findByText(/exceeds your paid leave balance/i),
    ).toBeInTheDocument();
  });

  /**
   * Regression: React resets an uncontrolled form once its action settles, so a
   * rejected request used to wipe the dates and remarks the employee had typed.
   * The inputs are controlled specifically to prevent that.
   */
  it("keeps what the employee typed when the request is rejected", async () => {
    applyLeaveAction.mockResolvedValue({ error: "That range only covers weekends." });
    const user = userEvent.setup();

    render(<LeaveForm minDate="2026-08-22" />);

    const remarks = screen.getByLabelText(/remarks/i) as HTMLTextAreaElement;
    await user.type(remarks, "Family wedding in Pune.");
    await user.selectOptions(screen.getByLabelText(/leave type/i), "sick");
    fillDates("2026-09-07", "2026-09-11");

    await user.click(screen.getByRole("button", { name: /submit request/i }));
    await screen.findByText(/only covers weekends/i);

    expect(remarks.value).toBe("Family wedding in Pune.");
    expect((screen.getByLabelText(/leave type/i) as HTMLSelectElement).value).toBe("sick");
    expect((screen.getByLabelText(/^from$/i) as HTMLInputElement).value).toBe("2026-09-07");
    expect((screen.getByLabelText(/^to$/i) as HTMLInputElement).value).toBe("2026-09-11");
  });

  it("passes the employee's choices through to the action", async () => {
    applyLeaveAction.mockResolvedValue({ ok: "Leave request submitted." });
    const user = userEvent.setup();

    render(<LeaveForm minDate="2026-08-22" />);
    await user.selectOptions(screen.getByLabelText(/leave type/i), "unpaid");
    fillDates("2026-09-07", "2026-09-09");
    await user.click(screen.getByRole("button", { name: /submit request/i }));

    expect(await screen.findByText(/leave request submitted/i)).toBeInTheDocument();

    const formData = applyLeaveAction.mock.calls[0][1] as FormData;
    expect(formData.get("leaveType")).toBe("unpaid");
    expect(formData.get("startDate")).toBe("2026-09-07");
    expect(formData.get("endDate")).toBe("2026-09-09");
  });

  it("stops the end date being set before the start date", async () => {
    render(<LeaveForm minDate="2026-08-22" />);

    const end = screen.getByLabelText(/^to$/i) as HTMLInputElement;

    // Before a start date is chosen the floor is today; after, it is the start.
    expect(end.min).toBe("2026-08-22");
    fireEvent.change(screen.getByLabelText(/^from$/i), { target: { value: "2026-09-10" } });
    expect(end.min).toBe("2026-09-10");
  });

  it("counts working days, excludes weekends, and uses singular and plural copy", () => {
    render(<LeaveForm minDate="2026-08-22" />);

    fillDates("2026-09-11", "2026-09-14");
    expect(screen.getByText("Requesting 2 working days")).toBeInTheDocument();
    expect(screen.getByText("Excludes weekends")).toBeInTheDocument();

    fillDates("2026-09-14", "2026-09-14");
    expect(screen.getByText("Requesting 1 working day")).toBeInTheDocument();
    expect(screen.queryByText("Requesting 1 working days")).not.toBeInTheDocument();
  });

  it("shows an over-balance warning for paid and sick leave", async () => {
    const user = userEvent.setup();
    render(
      <LeaveForm
        minDate="2026-08-22"
        balances={[
          { leaveType: "paid", left: 1, entitled: 10 },
          { leaveType: "sick", left: 0, entitled: 5 },
        ]}
      />,
    );

    fillDates("2026-09-07", "2026-09-09");
    expect(screen.getByText("Exceeds quota")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/leave type/i), "sick");
    expect(screen.getByText("Exceeds quota")).toBeInTheDocument();
  });

  it("does not apply balance limits to unpaid leave", async () => {
    const user = userEvent.setup();
    render(
      <LeaveForm
        minDate="2026-08-22"
        balances={[{ leaveType: "unpaid", left: 0, entitled: 0 }]}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/leave type/i), "unpaid");
    fillDates("2026-09-07", "2026-09-11");

    expect(screen.getByText("Requesting 5 working days")).toBeInTheDocument();
    expect(screen.getByText("Excludes weekends")).toBeInTheDocument();
    expect(screen.queryByText("Exceeds quota")).not.toBeInTheDocument();
  });

  it("does not show a day summary for empty or weekend-only ranges", () => {
    render(<LeaveForm minDate="2026-08-22" />);

    expect(screen.queryByText(/Requesting .* working day/)).not.toBeInTheDocument();
    fillDates("2026-09-12", "2026-09-13");
    expect(screen.queryByText(/Requesting .* working day/)).not.toBeInTheDocument();
  });

  it("moves the end date forward when the start date passes it", () => {
    render(<LeaveForm minDate="2026-08-22" />);
    fillDates("2026-09-07", "2026-09-09");

    fireEvent.change(screen.getByLabelText(/^from$/i), {
      target: { value: "2026-09-14" },
    });

    expect((screen.getByLabelText(/^to$/i) as HTMLInputElement).value).toBe("2026-09-14");
    expect(screen.getByText("Requesting 1 working day")).toBeInTheDocument();
  });
});
