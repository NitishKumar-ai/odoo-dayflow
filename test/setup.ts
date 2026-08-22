import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Server actions call these outside a Next request context in tests.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
