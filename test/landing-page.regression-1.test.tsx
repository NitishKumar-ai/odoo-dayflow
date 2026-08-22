// Regression: ISSUE-001/ISSUE-003 — the landing page shipped a hero image the
// repo no longer contained, and hid every route to /signin on mobile.
// Found by /qa on 2026-08-22
// Report: .gstack/qa-reports/qa-report-dayflow-inmodel-in-2026-08-22.md
import { existsSync, readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ user: null as null | { id: string } }));
const redirect = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  getSessionUser: () => Promise.resolve(auth.user),
}));

vi.mock("next/navigation", () => ({ redirect }));

import Home from "@/app/page";

describe("landing page assets and mobile reachability", () => {
  beforeEach(() => {
    auth.user = null;
    redirect.mockReset();
  });

  it("only references images that exist in public/", async () => {
    const { container } = render(await Home());
    const sources = Array.from(container.querySelectorAll("img"))
      .map((img) => img.getAttribute("src") ?? "")
      .map((src) => {
        // next/image rewrites to /_next/image?url=<encoded>&w=..&q=..
        const match = /[?&]url=([^&]+)/.exec(src);
        return decodeURIComponent(match ? match[1] : src);
      })
      .filter((src) => src.startsWith("/"));

    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) {
      expect(existsSync(`public${src}`), `missing public${src}`).toBe(true);
    }
  });

  it("keeps a sign-in route in the header and the footer account column", async () => {
    const { container } = render(await Home());

    const nav = container.querySelector("nav");
    expect(nav).not.toBeNull();
    expect(nav!.querySelector('a[href="/signin"]')).not.toBeNull();

    const footer = container.querySelector("footer");
    expect(footer).not.toBeNull();
    expect(footer!.querySelector('a[href="/signin"]')).not.toBeNull();
    expect(footer!.querySelector('a[href="/signup"]')).not.toBeNull();
  });

  it("still offers sign-in to a signed-out visitor", async () => {
    render(await Home());
    expect(screen.getAllByRole("link", { name: /sign in/i }).length).toBeGreaterThanOrEqual(2);
  });

  // jsdom does not apply CSS-module rules, so the DOM assertions above cannot
  // see display:none. These read the stylesheet directly, which is where
  // ISSUE-003 actually lived.
  describe("mobile stylesheet", () => {
    const css = readFileSync("src/app/landing.module.css", "utf8");

    it("does not hide the header sign-in link under the mobile breakpoint", () => {
      expect(css).toContain(".navLinks>a:not(.navCta):not(.navSignIn){display:none}");
      expect(css).not.toContain(".navLinks>a:not(.navCta){display:none}");
    });

    it("hides the footer PRODUCT column by name, not by source order", () => {
      // :last-of-type silently retargets whenever a footer column is added,
      // which is how the ACCOUNT column (sign in / get started) disappeared.
      expect(css).not.toContain(".footerLinks:last-of-type{display:none}");
      expect(css).toContain(".footerProduct{display:none}");
    });

    it("lets the reduced-motion override outrank the reveal animation", () => {
      const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion:reduce)"));
      expect(reduced).toContain('.page[data-motion="ready"] [data-reveal]');
    });
  });
});
