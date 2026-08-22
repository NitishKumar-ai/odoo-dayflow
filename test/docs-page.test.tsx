import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DocsPage from "@/app/docs/page";

describe("documentation page", () => {
  it("presents onboarding, product guides, and account actions", () => {
    render(<DocsPage />);

    expect(screen.getByRole("heading", { name: /everything you need to keep work in flow/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /from clone to check-in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create an account/i })).toHaveAttribute("href", "/signup");
    expect(screen.getAllByRole("link", { name: /documentation/i })[0]).toHaveAttribute("href", "/docs");
  });
});
