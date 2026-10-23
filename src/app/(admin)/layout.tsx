"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { useAuth } from "@/lib/auth/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) {
    return null;
  }

  return (
    <SidebarProvider>
      {/* The design puts the rail full-height beside a content column that
          carries its own header, rather than a header across the top. */}
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="w-full max-w-[1360px] px-4 pt-7 pb-12 md:px-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
