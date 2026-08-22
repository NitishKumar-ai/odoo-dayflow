import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const signInAction = vi.fn();
const signUpAction = vi.fn();

vi.mock("@/actions/auth", () => ({
  signInAction: (...args: unknown[]) => signInAction(...args),
  signUpAction: (...args: unknown[]) => signUpAction(...args),
}));

import SignInPage from "@/app/(auth)/signin/page";
import SignUpPage from "@/app/(auth)/signup/page";

describe("authentication pages", () => {
  beforeEach(() => {
    signInAction.mockReset();
    signUpAction.mockReset();
  });

  it("lets the user show and hide the sign-in password", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);

    const password = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    expect(password.type).toBe("password");

    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(password.type).toBe("text");

    await user.click(screen.getByRole("button", { name: "Hide" }));
    expect(password.type).toBe("password");
  });

  it("keeps entered sign-in credentials when authentication fails", async () => {
    signInAction.mockResolvedValue({ error: "Email or password is incorrect." });
    const user = userEvent.setup();
    render(<SignInPage />);

    const email = screen.getByLabelText(/work email/i) as HTMLInputElement;
    const password = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    await user.type(email, "employee@example.test");
    await user.type(password, "Wrong-password-1!");
    await user.click(screen.getByRole("button", { name: /sign in to dayflow/i }));

    expect(await screen.findByText(/email or password is incorrect/i)).toBeInTheDocument();
    expect(email.value).toBe("employee@example.test");
    expect(password.value).toBe("Wrong-password-1!");
  });

  it("updates every password rule as a strong signup password is entered", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);

    const ruleLabels = [
      "At least 10 characters",
      "Uppercase letter (A-Z)",
      "Lowercase letter (a-z)",
      "At least one number (0-9)",
      "Special symbol (!@#$%^&*)",
    ];

    for (const label of ruleLabels) {
      expect(screen.getByText(label).parentElement).not.toHaveClass("text-emerald-600");
    }

    await user.type(screen.getByLabelText(/^password$/i), "StrongPass1!");

    for (const label of ruleLabels) {
      expect(screen.getByText(label).parentElement).toHaveClass("text-emerald-600");
    }
  });

  it("shows partial signup password progress without marking unmet rules", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);

    await user.type(screen.getByLabelText(/^password$/i), "lowercase");

    expect(screen.getByText("Lowercase letter (a-z)").parentElement).toHaveClass("text-emerald-600");
    expect(screen.getByText("At least 10 characters").parentElement).not.toHaveClass("text-emerald-600");
    expect(screen.getByText("Uppercase letter (A-Z)").parentElement).not.toHaveClass("text-emerald-600");
    expect(screen.getByText("At least one number (0-9)").parentElement).not.toHaveClass("text-emerald-600");
    expect(screen.getByText("Special symbol (!@#$%^&*)").parentElement).not.toHaveClass("text-emerald-600");
  });
});
