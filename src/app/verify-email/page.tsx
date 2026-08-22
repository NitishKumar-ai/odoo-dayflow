import Link from "next/link";
import { Brand } from "@/components/Brand";
import { Alert } from "@/components/Alert";
import { verifyEmailAction } from "@/actions/auth";

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  const sent = typeof params.sent === "string" ? params.sent : null;
  const devToken = typeof params.devToken === "string" ? params.devToken : null;

  const result = token ? await verifyEmailAction(token) : null;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex">
          <Brand size="lg" />
        </Link>

        <div className="card p-6">
          <h1 className="text-lg font-semibold">Email verification</h1>

          {result?.ok ? (
            <div className="mt-4 space-y-4">
              <Alert tone="success">
                Your email is verified. You can sign in now.
              </Alert>
              <Link href="/signin" className="btn-primary">Go to sign in</Link>
            </div>
          ) : result && !result.ok ? (
            <div className="mt-4 space-y-4">
              <Alert>{result.error}</Alert>
              <Link href="/signup" className="btn-secondary">Back to sign up</Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted">
                {sent
                  ? `We sent a verification link to ${sent}. Open it to activate your account.`
                  : "Open the verification link from your email to activate your account."}
              </p>
              {devToken ? (
                <Alert tone="info">
                  <span className="font-medium">Development only:</span> no mail service is
                  configured yet, so use this link directly —{" "}
                  <Link
                    href={`/verify-email?token=${devToken}`}
                    className="font-medium text-brand underline"
                  >
                    verify now
                  </Link>
                </Alert>
              ) : null}
              <Link href="/signin" className="btn-secondary">Back to sign in</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
