import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

const requireAdmin = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

import ProjectDashboardPage from "@/app/(app)/admin/project/page";

describe("admin project dashboard", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requireAdmin.mockResolvedValue(undefined);
  });

  it("checks administrator access before rendering anything", async () => {
    render(await ProjectDashboardPage());

    expect(requireAdmin).toHaveBeenCalledTimes(1);
  });

  it("refuses to render for a non-administrator", async () => {
    requireAdmin.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(ProjectDashboardPage()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("counts blocked and ready roadmap items from the roadmap itself", async () => {
    render(await ProjectDashboardPage());

    const ready = screen.getByText("Ready to start").closest("div");
    const blocked = screen.getByText("External blockers").closest("div");

    // 3 Ready items, 2 Blocked items, 1 Planned in the roadmap.
    expect(ready?.parentElement).toHaveTextContent("3");
    expect(blocked?.parentElement).toHaveTextContent("2");
  });

  it("lists the delivery roadmap with priorities and dependencies", async () => {
    render(await ProjectDashboardPage());

    expect(screen.getByText("Send verification email")).toBeInTheDocument();
    expect(screen.getByText("Mail provider account and API key")).toBeInTheDocument();
    expect(screen.getByText("Turn on CI")).toBeInTheDocument();
    expect(screen.getAllByText("P0")).toHaveLength(1);
  });

  it("shows the shipped core modules", async () => {
    render(await ProjectDashboardPage());

    const completed = screen
      .getByRole("heading", { name: "Core product scope" })
      .closest("section") as HTMLElement;

    expect(within(completed).getByText("Authentication")).toBeInTheDocument();
    expect(within(completed).getByText("Payroll")).toBeInTheDocument();
    expect(within(completed).getByText("Attendance")).toBeInTheDocument();
    expect(screen.getByText("6 / 6")).toBeInTheDocument();
  });
});
