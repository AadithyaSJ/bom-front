"use client";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { useState, useEffect } from "react";

interface BankingAccount {
  id: string | number;
  account_type: "bank" | "credit_card";
  currency: string;
  description?: string;
  notes?: string;
  primary: boolean;

  // Bank fields (some are optional because they may be blank)
  account_name?: string;
  account_code?: string;
  account_number?: string;
  bank_name?: string;
  ifsc?: string;
  opening_balance?: number | null;
  current_balance: number;

  // Credit card fields (optional where blank)
  card_number?: string;
  card_holder_name?: string;
  expiry_date?: string | null; // ISO date string expected from API
  credit_limit?: number | null;
  issuing_bank?: string;
  statement_day?: number | null;
  payment_due_day?: number | null;
  opening_outstanding?: number | null;
  current_outstanding: number;

  created_at: string;  // ISO datetime string from API
  updated_at: string;
}


export default function BankingOnePage() {
  const [accounts, setAccounts] = useState<BankingAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/banking/banking-accounts/");
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.results || []);
        } else {
          setAccounts([]);
        }
      } catch {
        setAccounts([]);
      } finally {
        setLoadingAccounts(false);
      }
    }
    loadAccounts();
  }, []);

  if (loadingAccounts) return <div>Loading accounts...</div>;

  return (
  <div className="min-h-screen w-full bg-gradient-to-br from-[#e6f4f1] to-[#d0ebe3] flex justify-center">
    <div className="relative w-full max-w-5xl p-8">
      {/* Top right button */}
      <div className="absolute top-6 right-6 flex gap-3 z-10">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700"
          onClick={() => router.push("/books/banking/new")}
        >
          Add Bank Manually
        </button>
      </div>

      {/* Message */}
      <div className="mb-8 mt-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-800">Stay on top of your money</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mt-2">
          Connect your bank and credit cards to fetch all your transactions.
          Create, categorize and match these transactions to those you have in Glonix.
        </p>
      </div>

      {/* Table */}
      {accounts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border border-green-300 rounded shadow bg-white">
            <thead className="bg-green-100">
              <tr>
                <th className="border border-green-300 p-3 text-left">Type</th>
                <th className="border border-green-300 p-3 text-left">Name</th>
                <th className="border border-green-300 p-3 text-left">Account Number</th>
                <th className="border border-green-300 p-3 text-left">Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acct) => (
                <tr key={acct.id} className="even:bg-green-50">
                  <td className="border border-green-300 p-3 capitalize">{acct.account_type}</td>
                  <td className="border border-green-300 p-3">
                    {acct.account_type === "bank"
                      ? acct.account_name
                      : acct.card_holder_name}
                  </td>
                  <td className="border border-green-300 p-3">
                    {acct.account_type === "bank"
                      ? acct.account_number
                      : acct.card_number}
                  </td>
                  <td className="border border-green-300 p-3 font-medium text-right">
                    ₹
                    {(acct.current_balance ?? acct.current_outstanding)?.toFixed(2) ??
                      "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-12">
          No bank accounts added yet.
        </div>
      )}
    </div>
  </div>
);

}
