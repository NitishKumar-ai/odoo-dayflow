import { describe, it, expect, vi } from "vitest";
import { useLayoutEffect, useRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFields } from "@/components/useFields";

/**
 * A password manager fills the form before React hydrates, so the value is
 * already in the DOM when useFields' effect first runs. useLayoutEffect fires
 * before useEffect, which reproduces that ordering faithfully.
 */
function AutofilledForm({ onSubmit }: { onSubmit: (fd: FormData) => void }) {
  const { values, field } = useFields({ email: "", password: "" });
  const formRef = useRef<HTMLFormElement>(null);

  useLayoutEffect(() => {
    const form = formRef.current!;
    (form.elements.namedItem("email") as HTMLInputElement).value = "saved@example.com";
    (form.elements.namedItem("password") as HTMLInputElement).value = "s3cret-from-manager";
  }, []);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
    >
      <label htmlFor="email">Email</label>
      <input {...field("email")} type="email" />
      <label htmlFor="password">Password</label>
      <input {...field("password")} type="password" />
      <output aria-label="state-email">{values.email}</output>
      <button type="submit">Sign in</button>
    </form>
  );
}

describe("useFields and password-manager autofill", () => {
  /** Regression: the sync effect used to write empty state over autofilled values. */
  it("keeps credentials the browser filled before hydration", async () => {
    render(<AutofilledForm onSubmit={() => {}} />);

    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe(
      "saved@example.com",
    );
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe(
      "s3cret-from-manager",
    );
  });

  it("adopts the autofilled values into state, so a submit carries them", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<AutofilledForm onSubmit={onSubmit} />);

    // State, not just the DOM, must hold the value or the reset would lose it.
    expect(screen.getByLabelText("state-email").textContent).toBe("saved@example.com");

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    const fd = onSubmit.mock.calls[0][0] as FormData;
    expect(fd.get("email")).toBe("saved@example.com");
    expect(fd.get("password")).toBe("s3cret-from-manager");
  });

  it("still lets the user type over an autofilled value", async () => {
    const user = userEvent.setup();
    render(<AutofilledForm onSubmit={() => {}} />);

    const email = screen.getByLabelText("Email") as HTMLInputElement;
    await user.clear(email);
    await user.type(email, "someone.else@example.com");

    expect(email.value).toBe("someone.else@example.com");
    expect(screen.getByLabelText("state-email").textContent).toBe(
      "someone.else@example.com",
    );
  });
});
