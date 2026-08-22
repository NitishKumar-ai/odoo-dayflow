import Link from "next/link";
import { Brand } from "@/components/Brand";
import { Alert } from "@/components/Alert";
import { verifyEmailAction } from "@/actions/auth";
import { IconCheckCircle, IconMail, IconArrowRight } from "@/components/Icons";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  const sent = typeof params.sent === "string" ? params.sent : null;
  const devToken = typeof params.devToken === "string" ? params.devToken : null;

  const result = token ? await verifyEmailAction(token) : null;

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 py-12 selection:bg-brand selection:text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex transition-transform hover:scale-[1.02]">
            <Brand size="lg" />
          </Link>
          <p className="mt-2 text-sm text-muted">Account Activation & Verification</p>
        </div>

        <div className="card p-6 sm:p-8 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
              <IconMail size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Email verification</h1>
              <p className="text-xs text-muted">Confirming your company identity</p>
            </div>
          </div>

          {result?.ok ? (
            <div className="mt-4 space-y-4">
              <Alert tone="success">
                Your email has been verified successfully! You can now sign in with your password.
              </Alert>
              <Link href="/signin" className="btn-primary w-full shadow-md shadow-brand/20">
                <span>Proceed to Sign In</span>
                <IconArrowRight size={16} />
              </Link>
            </div>
          ) : result && !result.ok ? (
            <div className="mt-4 space-y-4">
              <Alert tone="error">{result.error}</Alert>
              <Link href="/signup" className="btn-secondary w-full">
                Back to Sign Up
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted leading-relaxed">
                {sent
                  ? `We've generated a verification link for ${sent}. Please check your inbox or click the developer preview link below.`
                  : "Open the verification link sent to your email to activate your account."}
              </p>

              {devToken ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-800/40 dark:bg-blue-950/30">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                    <IconCheckCircle size={14} className="text-brand" />
                    <span>Local Development Preview:</span>
                  </div>
                  <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">
                    Click the direct token below to activate immediately:
                  </p>
                  <Link
                    href={`/verify-email?token=${devToken}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                  >
                    <span>Activate Account Instantly</span>
                    <IconArrowRight size={12} />
                  </Link>
                </div>
              ) : null}

              <Link href="/signin" className="btn-secondary w-full">
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
