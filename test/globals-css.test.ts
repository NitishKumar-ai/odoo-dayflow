import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

/**
 * Regression guard for the cascade bug that put every icon-prefixed input's
 * text underneath its icon: `.input` was declared unlayered, so it beat the
 * `pl-10` utility that Tailwind emits into `@layer utilities`. Component
 * classes must stay inside `@layer components` so utilities can override them.
 */
describe("globals.css cascade", () => {
  it("declares the shared component classes inside @layer components", () => {
    const layer = css.indexOf("@layer components {");
    expect(layer).toBeGreaterThan(-1);

    for (const cls of [".card {", ".input {", ".pill {", ".th {", ".td {"]) {
      expect(css.indexOf(cls)).toBeGreaterThan(layer);
    }
  });

  it("keeps the input padding overridable by a utility class", () => {
    // If .input ever gains an unlayered duplicate, the utility loses again.
    const unlayered = css.slice(0, css.indexOf("@layer components {"));
    expect(unlayered).not.toContain(".input {");
  });

  it("honours the reduced-motion preference outside the components layer", () => {
    const motion = css.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(motion).toBeGreaterThan(-1);
    // Must sit after the components layer closes so it is not scoped into it.
    expect(motion).toBeGreaterThan(css.lastIndexOf("@layer components {"));
    expect(css.slice(motion)).toContain("animation-iteration-count: 1 !important");
  });

  it("keeps a 44px touch target on the primary button family", () => {
    expect(css).toContain("min-height: 2.75rem");
  });
});
