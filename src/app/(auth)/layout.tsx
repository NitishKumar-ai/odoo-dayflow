import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 inline-flex">
          <Brand size="lg" />
        </Link>
        <p className="mb-6 text-sm text-muted">Every workday, perfectly aligned.</p>
        {children}
      </div>
    </main>
  );
}
