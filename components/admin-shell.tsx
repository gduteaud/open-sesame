"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/admin" className="text-foreground">
              Open Sesame
            </Link>
            <Link
              href="/admin/events/new"
              className="text-muted-foreground hover:text-foreground"
            >
              New event
            </Link>
          </nav>
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            <LogOut className="mr-2 size-4" />
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
