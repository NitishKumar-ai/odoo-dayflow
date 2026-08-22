import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ user: null as null | { id: string } }));
const redirect = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  getSessionUser: () => Promise.resolve(auth.user),
}));

vi.mock("next/navigation", () => ({ redirect }));

import Home from "@/app/page";

describe("public landing page", () => {
  beforeEach(() => {
    auth.user = null;
    redirect.mockReset();
  });

  it("shows the product story and real account links to visitors", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", {
        name: /a better workday doesn't start with paperwork/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /start your day/i })[0]).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(screen.getAllByRole("link", { name: /sign in/i })[0]).toHaveAttribute(
      "href",
      "/signin",
    );
  });

  it("sends an authenticated visitor straight to the dashboard", async () => {
    auth.user = { id: "user-1" };

    await Home();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
