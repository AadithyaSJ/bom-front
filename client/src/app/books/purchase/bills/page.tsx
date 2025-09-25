"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/auth/tokenservice";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { FaTrash } from "react-icons/fa";

// Bill type definition
type Bill = {
  id: string;
  bill_date?: string;
  bill_number?: string;
  reference_number?: string;
  vendor?: { name?: string; display_name?: string } | string | null;
  status?: "PAID" | "UNPAID" | "PARTIAL" | "PENDING";
  due_date?: string;
  total_amount?: string;
  balanceDue?: number;
  amount?: number;
};

const statusColor: Record<string, string> = {
  PAID: "text-emerald-600",
  UNPAID: "text-red-600",
  PARTIAL: "text-amber-600",
  PENDING: "text-gray-500",
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const baseApiUrl = "https://web-production-6baf3.up.railway.app/api/bills/";

  async function fetchBills(url?: string, pageNumber = 1) {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = url || `${baseApiUrl}?page=${pageNumber}`;
      const res = await fetchWithAuth(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch bills");
      const data = await res.json();
      setBills(data.results || []);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      if (!url) setPage(pageNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBills(undefined, page);
  }, [page]);

  async function handleDeleteBill(id: string) {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;

    try {
      const res = await fetchWithAuth(`${baseApiUrl}${id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete bill");

      // Show success alert
      alert("Bill deleted successfully");

      // Remove deleted bill from state
      setBills((prev) => prev.filter((b) => b.id !== id));

      // Optionally refresh page data if needed
      // fetchBills();
    } catch (err) {
      alert("Failed to delete bill");
      console.error(err);
    }
  }

  function handlePrevPage() {
    if (prevPageUrl) {
      fetchBills(prevPageUrl);
      setPage((p) => Math.max(1, p - 1));
    }
  }

  function handleNextPage() {
    if (nextPageUrl) {
      fetchBills(nextPageUrl);
      setPage((p) => p + 1);
    }
  }

  return (
    <div className="p-4 space-y-4 md:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl text-emerald-700">All Bills</h1>
        <Link
          href="/books/purchase/bills/new"
          className="flex items-center gap-2 px-5 py-2 font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700"
        >
          <Plus size={16} /> New
        </Link>
      </div>

      {/* Error Display */}
      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* Loading State */}
      {loading ? (
        <div>Loading bills...</div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-2xl bg-white">
            <table className="min-w-full">
              <thead className="bg-emerald-50 text-emerald-800">
                <tr className="text-left">
                  <th className="p-3">Date</th>
                  <th className="p-3">Bill</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Balance Due</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-gray-500">
                      No bills yet. Click New to create one.
                    </td>
                  </tr>
                ) : (
                  bills.map((b) => (
                    <tr
                      key={b.id}
                      className={`hover:bg-emerald-50 ${
                        b.status ? {
                          "PAID": "bg-green-100",
                          "UNPAID": "bg-red-100",
                          "PARTIAL": "bg-yellow-100",
                          "PENDING": "bg-gray-100",
                        }[b.status] : ""
                      }`}
                    >
                      <td className="p-3">{b.bill_date || "-"}</td>
                      <td className="px-4 py-3 font-medium text-green-700">
                      <Link href={`/books/purchase/bills/${b.id}`} className="hover:underline">
                        {b.bill_number || "-"}
                      </Link>
                    </td>
                      <td className="p-3">{b.reference_number || "-"}</td>
                      <td className="p-3">
                        {typeof b.vendor === "object"
                          ? b.vendor?.name ||
                            [b.vendor?.display_name].filter(Boolean).join(" ") ||
                            "-"
                          : b.vendor || "-"}
                      </td>
                      <td className={`p-3 font-medium uppercase ${statusColor[b.status || "PENDING"]}`}>
                        {b.status || "PENDING"}
                      </td>
                      <td className="p-3">{b.due_date || "-"}</td>
                      <td className="p-3">
                        {b.total_amount
                          ? parseFloat(b.total_amount).toFixed(2)
                          : "0.00"}
                      </td>
                      <td className="p-3">
                        {typeof b.balanceDue === "number" ? b.balanceDue.toFixed(2) : "0.00"}
                      </td>
                      <td className="p-3">
                        <button
                          className="text-red-600 hover:text-red-800"
                          aria-label="Delete vendor"
                          title="Delete vendor"
                          onClick={() => handleDeleteBill(b.id)}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
            <span>Showing {bills.length} bill{bills.length !== 1 ? "s" : ""}</span>
            <div className="flex gap-1">
              <button
                disabled={!prevPageUrl}
                onClick={handlePrevPage}
                className={`flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:bg-green-50 transition ${
                  !prevPageUrl ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button className="border px-3 py-1.5 rounded-lg bg-green-600 text-white shadow-sm">
                {page}
              </button>
              <button
                disabled={!nextPageUrl}
                onClick={handleNextPage}
                className={`flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:bg-green-50 transition ${
                  !nextPageUrl ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
