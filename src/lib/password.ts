/**
 * Password rules (spec 3.1.1: "Password must follow security rules").
 * Kept free of server-only imports so the rule is directly testable.
 */
export function passwordProblems(pw: string): string[] {
  const problems: string[] = [];
  if (pw.length < 10) problems.push("be at least 10 characters");
  if (!/[a-z]/.test(pw)) problems.push("include a lowercase letter");
  if (!/[A-Z]/.test(pw)) problems.push("include an uppercase letter");
  if (!/[0-9]/.test(pw)) problems.push("include a number");
  if (!/[^A-Za-z0-9]/.test(pw)) problems.push("include a symbol");
  return problems;
}
