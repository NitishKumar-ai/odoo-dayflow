import Link from "next/link";
import { Brand } from "@/components/Brand";
import { IconCheck, IconShield } from "@/components/Icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 selection:bg-daylight selection:text-foreground">
      <div aria-hidden className="absolute inset-x-0 top-0 h-2 bg-signal" />
      <div aria-hidden className="absolute -left-24 top-1/3 hidden h-px w-72 rotate-90 bg-foreground/20 sm:block" />

      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex transition-transform hover:scale-[1.02]">
            <Brand size="lg" />
          </Link>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            The workday, finally in flow.
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
