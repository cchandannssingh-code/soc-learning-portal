"use client";

import { useState } from "react";
import SidebarTree from "./SidebarTree";
import { TreeItem } from "@/lib/notes";
import { useAuth } from "./AuthProvider";

export default function Sidebar({ tree }: { tree: TreeItem[] }) {
  const { logout } = useAuth();
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const handleLogout = async () => {
    logout();
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#071224] border-b border-[#1e3354] px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">🛡️ SOCForge</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white text-xl"
        >
          ☰
        </button>
      </div>

      {/* OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed md:sticky top-0 left-0 z-50
          w-72 h-screen bg-[#071224]
          text-white p-5 overflow-y-auto
          transition-transform duration-300
          border-r border-[#1e3354]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between mb-8 mt-10 md:mt-0">
          <h1 className="text-2xl font-bold tracking-wide">🛡️ SOCForge</h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <SidebarTree
            items={tree}
            openFolders={openFolders}
            toggleFolder={toggleFolder}
            setMobileOpen={setMobileOpen}
          />
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-500 text-white py-2 px-3 rounded-lg transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
