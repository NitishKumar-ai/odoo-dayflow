import Link from "next/link";
import { Brand } from "@/components/Brand";
import { IconCheck, IconShield } from "@/components/Icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 py-12 selection:bg-brand selection:text-white">
      {/* Subtle Background Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-10 left-1/2 -z-10 h-72 w-[500px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex transition-transform hover:scale-[1.02]">
            <Brand size="lg" />
          </Link>
          <p className="mt-2 text-sm text-muted">
            The intelligent workday & HR management platform.
          </p>
        </div>

        {children}

        <div className="flex items-center justify-center gap-6 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <IconShield size={14} className="text-emerald-600" />
            <span>Secure JWT Sessions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconCheck size={14} className="text-emerald-600" />
            <span>Enterprise Verified</span>
          </div>
        </div>
      </div>
    </main>
  );
}
