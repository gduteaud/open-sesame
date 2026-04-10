import Link from "next/link";
import { ClaimForm } from "@/components/claim-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Open Sesame
        </h1>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
          OpenRouter API key management made simple.
        </p>
      </div>

      <ClaimForm />

      <Link
        href="/admin/login"
        className="text-muted-foreground/50 text-xs underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
      >
        Admin
      </Link>
    </div>
  );
}
