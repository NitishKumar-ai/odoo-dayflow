// `server-only` throws when resolved through the browser condition, which is
// what vitest does. Tests import server modules deliberately, so stub it out.
export {};
