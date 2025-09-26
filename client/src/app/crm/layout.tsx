"use client";

import SecondarySidebar from "./components/SecondarySidebar";
import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function CRMLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem("refresh"); // stored refresh token
      if (!refresh) {
        router.push("/login");
        return;
      }

      await fetch("https://web-production-6baf3.up.railway.app/api/auth/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
      });

      // Clear tokens from storage
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      router.push("/login"); // redirect after logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="border-b border-gray-200">
           <TopNavbar onLogout={handleLogout} />
        </header>
      </div>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="border-r border-gray-200">
          <Sidebar />
        </aside>

        {/* Page Content */}
        <main className="flex-1 overf   low-y-auto p-4">{children}</main>
      </div>
    </>
  );
}
