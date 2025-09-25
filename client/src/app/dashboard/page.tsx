'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from '@/components/Card';
import { Book, LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    async function validateTokens() {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken || !refreshToken) {
        // No tokens, redirect to login
        router.push("/login");
        return;
      }

      try {
        // Attempt silent refresh of access token
  const res = await fetch("https://web-production-6baf3.up.railway.app/api/auth/token/refresh/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!res.ok) {
          throw new Error("Failed to refresh token");
        }

        const data = await res.json();
        localStorage.setItem("accessToken", data.access);
      } catch (err) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        router.push("/login");
      }
    }
    validateTokens();
  }, [router]);

  return (
    <div className="min-h-screen px-6 py-12 bg-gradient-to-br from-[#e6f4f1] to-[#d0ebe3] font-poppins">
      
      {/* Add margin-top to move the cards down */}
      <div className="grid max-w-6xl grid-cols-1 gap-10 mx-auto sm:grid-cols-2 mt-[10vh]">
        <Card
          title="Books"
          subtitle="Books / Accounts / Inventory"
          route="/books"
          icon={<Book className="w-12 h-12" />}
        />
        <Card
          title="CRM"
          subtitle="Workflow Management"
          route="/crm"
          icon={<LayoutDashboard className="w-12 h-12" />}
        />
      </div>
    </div>
  );
}