import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const pathname = vi.hoisted(() => ({ current: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

import { Nav } from "@/components/Nav";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/attendance", label: "Attendance" },
  { href: "/admin/leave", label: "Approvals" },
];

describe("Nav", () => {
  it("marks only the exactly matching link as the current page", () => {
    pathname.current = "/attendance";
    render(<Nav items={items} />);

    expect(screen.getByRole("link", { name: /attendance/i })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /dashboard/i })).not.toHaveAttribute("aria-current");
  });

  it("keeps a section active on its nested routes", () => {
    pathname.current = "/admin/leave/pending";
    render(<Nav items={items} />);

    expect(screen.getByRole("link", { name: /approvals/i })).toHaveAttribute("aria-current", "page");
  });

  it("does not treat every nested route as inside the dashboard", () => {
    pathname.current = "/dashboard/anything";
    render(<Nav items={items} />);

    expect(screen.getByRole("link", { name: /dashboard/i })).not.toHaveAttribute("aria-current");
  });

  it("renders the project link with its own icon", () => {
    pathname.current = "/admin/project";
    render(<Nav items={[{ href: "/admin/project", label: "Project" }]} />);

    const link = screen.getByRole("link", { name: /project/i });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link.querySelector("svg")).toBeInTheDocument();
  });

  it("renders a label with no mapped icon without crashing", () => {
    pathname.current = "/reports";
    render(<Nav items={[{ href: "/reports", label: "Reports" }]} />);

    const link = screen.getByRole("link", { name: "Reports" });
    expect(link).toBeInTheDocument();
    expect(link.querySelector("svg")).toBeNull();
  });

  it("shows a pending count badge but hides an empty one", () => {
    pathname.current = "/dashboard";
    render(
      <Nav
        items={[
          { href: "/admin/leave", label: "Approvals", badge: 4 },
          { href: "/admin/payroll", label: "Payroll", badge: 0 },
          { href: "/profile", label: "Profile" },
        ]}
      />,
    );

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /payroll/i })).not.toHaveTextContent("0");
  });
});
