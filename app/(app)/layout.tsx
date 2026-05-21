// Main app shell — sidebar + header + content area

"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useUIStore } from "@/lib/stores/ui.store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 md:relative md:z-auto md:flex
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header */}
        <Header />

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            <Breadcrumbs />
            <div className="p-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
