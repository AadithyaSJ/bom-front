"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";
import Link from "next/link";

type Transaction = {
  id: number;
  source_type: string;
  source_id: number;
  destination_type: string;
  destination_id: number;
  transaction_type: string;
  name: string;
  date: string;
  amount: number;
  description: string;
  reference_number?: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filtered, setFiltered] = useState<Transaction[]>([]);

  useEffect(() => {
    async function loadTransactions() {
      setLoading(true);
      try {
  const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/banking/transactions/");
        const data = await res.json();
        setTransactions(data.results || []);
      } finally {
        setLoading(false);
      }
    }
    loadTransactions();
  }, []);

  useEffect(() => {
    let result = [...transactions];
    if (filterFrom) result = result.filter((t) => new Date(t.date) >= new Date(filterFrom));
    if (filterTo) result = result.filter((t) => new Date(t.date) <= new Date(filterTo));
    setFiltered(result);
  }, [filterFrom, filterTo, transactions]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this transaction?")) return;
    try {
  const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/banking/transactions/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
      });
      if (res.ok) setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert("Network error");
    }
  }

  if (loading) return <div>Loading transactions...</div>;

  return (
    <div className="page p-6 bg-green-50 min-h-screen">
      <h1 className="mb-6 text-2xl font-bold text-green-900">Transactions</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div>
          <label className="block mb-1 text-sm font-medium text-green-800">From</label>
          <input type="date" className="px-2 py-1 border rounded" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-green-800">To</label>
          <input type="date" className="px-2 py-1 border rounded" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
        </div>
        <div>
  <label className="block mb-1 text-sm font-medium text-green-800 invisible">Placeholder</label>
  <Link href="/books/transactions/new">
    <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
      + Add Transaction
    </button>
  </Link>
</div>
      </div>

      <div className="bg-white shadow-md rounded overflow-auto max-h-[60vh]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-green-100">
            <tr>
              <th className="border p-2 text-green-800 uppercase">Type</th>
              <th className="border p-2 text-green-800 uppercase">Name</th>
              <th className="border p-2 text-green-800 uppercase">Date</th>
              <th className="border p-2 text-green-800 uppercase">Amount</th>
              <th className="border p-2 text-green-800 uppercase">Description</th>
              <th className="border p-2 text-green-800 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center italic text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-green-50">
                  <td className="border p-2 capitalize"><Link href={`/books/transactions/${t.id}`} className="text-green-700 mr-2">{t.transaction_type}</Link></td>
                  <td className="border p-2">{t.name}</td>
                  <td className="border p-2">{t.date}</td>
                  <td className="border p-2 font-semibold ">
                {["bank", "cash"].includes(t.destination_type) ? (
              <span className="text-green-700">+₹{t.amount.toFixed(2)}</span>
              ) : (
              <span className="text-red-600">-₹{t.amount.toFixed(2)}</span>
              )}
              </td>

                  <td className="border p-2">{t.description}</td>
                  <td className="border p-2">
                    <button className="text-red-600" onClick={() => handleDelete(t.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
