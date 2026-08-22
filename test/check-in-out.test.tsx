import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/actions/attendance", () => ({
  checkInAction: vi.fn(),
  checkOutAction: vi.fn(),
}));

vi.mock("@/components/LiveClock", () => ({
  LiveClock: () => <span>10:30 AM</span>,
}));

import { CheckInOut } from "@/components/CheckInOut";

describe("CheckInOut", () => {
  it("offers clock in before the employee starts work", () => {
    render(<CheckInOut checkedInAt={null} checkedOutAt={null} onLeave={false} />);

    expect(screen.getByText("Not Clocked In Yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clock in/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clock out/i })).not.toBeInTheDocument();
  });

  it("offers clock out while the employee is working", () => {
    render(<CheckInOut checkedInAt="09:12 AM" checkedOutAt={null} onLeave={false} />);

    expect(screen.getByText("Currently Clocked In")).toBeInTheDocument();
    expect(screen.getByText("09:12 AM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clock out/i })).toBeInTheDocument();
  });

  it("disables punching and shows leave guidance on approved leave", () => {
    render(<CheckInOut checkedInAt={null} checkedOutAt={null} onLeave />);

    expect(screen.getByText("On Approved Leave")).toBeInTheDocument();
    expect(screen.getByText("Enjoy your time off")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clock in|clock out/i })).not.toBeInTheDocument();
  });

  it("shows the completed state after checkout with no further action", () => {
    render(<CheckInOut checkedInAt="09:05 AM" checkedOutAt="05:42 PM" onLeave={false} />);

    expect(screen.getByText("Day Completed")).toBeInTheDocument();
    expect(screen.getByText("05:42 PM")).toBeInTheDocument();
    expect(screen.getByText("Checked out for today")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clock in|clock out/i })).not.toBeInTheDocument();
  });
});
