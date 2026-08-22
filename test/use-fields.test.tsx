import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const setAttendanceStatusAction = vi.fn();
vi.mock("@/actions/attendance", () => ({
  setAttendanceStatusAction: (...args: unknown[]) => setAttendanceStatusAction(...args),
}));

import { AttendanceOverride } from "@/components/admin/AttendanceOverride";

function renderRow(overrides: Partial<Parameters<typeof AttendanceOverride>[0]> = {}) {
  return render(
    <AttendanceOverride
      employeeId="emp-1"
      workDate="2026-08-21"
      status="present"
      note=""
      {...overrides}
    />,
  );
}

describe("useFields via AttendanceOverride", () => {
  beforeEach(() => setAttendanceStatusAction.mockReset());

  it("seeds the fields from the row's current values", () => {
    renderRow({ status: "half_day", note: "Client visit" });
    expect((screen.getByLabelText(/status/i) as HTMLSelectElement).value).toBe("half_day");
    expect((screen.getByLabelText(/note/i) as HTMLInputElement).value).toBe("Client visit");
  });

  /**
   * Regression: React resets the form after an action settles, and for a
   * controlled field whose value did not change between renders it does not
   * re-apply that value to the DOM. A <select> would silently revert to its
   * first option while state still held the chosen one — so the next submit
   * sent a status the admin never picked.
   */
  it("does not let the select revert after the action settles", async () => {
    setAttendanceStatusAction.mockResolvedValue({ error: "Missing employee or date." });
    const user = userEvent.setup();
    renderRow();

    await user.selectOptions(screen.getByLabelText(/status/i), "leave");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await screen.findByText(/missing employee or date/i);

    expect((screen.getByLabelText(/status/i) as HTMLSelectElement).value).toBe("leave");
  });

  it("submits the chosen status rather than the original one", async () => {
    setAttendanceStatusAction.mockResolvedValue({ ok: "Attendance updated." });
    const user = userEvent.setup();
    renderRow({ status: "present" });

    await user.selectOptions(screen.getByLabelText(/status/i), "absent");
    await user.type(screen.getByLabelText(/note/i), "No show");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await screen.findByText(/saved/i);
    const formData = setAttendanceStatusAction.mock.calls[0][1] as FormData;
    expect(formData.get("status")).toBe("absent");
    expect(formData.get("note")).toBe("No show");
    expect(formData.get("employeeId")).toBe("emp-1");
    expect(formData.get("workDate")).toBe("2026-08-21");
  });

  it("gives each row its own field ids so many rows can coexist", () => {
    const { container } = render(
      <>
        <AttendanceOverride employeeId="emp-1" workDate="2026-08-21" status="present" note="" />
        <AttendanceOverride employeeId="emp-2" workDate="2026-08-21" status="absent" note="" />
      </>,
    );
    const ids = [...container.querySelectorAll("select,input[name=note]")].map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
