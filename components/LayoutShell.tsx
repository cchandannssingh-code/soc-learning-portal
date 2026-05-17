"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-gray-800 bg-gray-950">
        <Sidebar closeSidebar={() => {}} />
      </aside>

      {/* Mobile Sidebar */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          <aside className="fixed top-0 left-0 z-50 h-full w-64 bg-gray-950 border-r border-gray-800 md:hidden">
            <Sidebar closeSidebar={() => setOpen(false)} />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Topbar */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-800 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="text-2xl"
          >
            ☰
          </button>

          <h1 className="font-bold">
            SOC Learning Portal
          </h1>
        </div>

        {/* Content */}
        <main className="max-w-5xl mx-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}