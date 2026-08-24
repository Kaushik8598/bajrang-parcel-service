"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { getStoredToken } from "@/lib/api/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Desktop: true = expanded sidebar | false = icon-only sidebar
  // Mobile:  true = drawer open       | false = drawer closed
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
    }
    // Default closed on small screens
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f2f5]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onExpand={() => setSidebarOpen(true)}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
