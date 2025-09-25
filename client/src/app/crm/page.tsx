'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CRMPage() {
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

  return <h1 className="text-2xl text-center mt-10">CRM Page</h1>;
}