"use client";

import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";
import { FaTrash, FaMix } from "react-icons/fa";
import { LuMerge  } from "react-icons/lu";
import { useRouter } from "next/navigation";


type CustomerType = {
  id: number;
  display_name: string;
  email: string;
  company_name: string;
  address?: string;
  phone?: string;
  created_at: string;
};

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

type Quote = {
  id: number;
  customer: CustomerType;
  quote_number: string;
  reference_number: string;
  quote_date: string;
  expiry_date: string;
  salesperson: string;
  project_name: string;
  subject: string;
  total_amount: string | number;
  status: QuoteStatus;
  customer_notes: string;
  terms_and_conditions?: string;
  created_at: string;
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const [editingStatusIds, setEditingStatusIds] = useState<Record<number, QuoteStatus>>({});
  const statusOptions: QuoteStatus[] = ["draft", "sent", "accepted", "rejected" , "expired"];
  const router = useRouter();


  const baseApiUrl = "https://web-production-6baf3.up.railway.app/api/quotes/";

  async function loadQuotes(url?: string, pageNumber = 1) {
    setLoading(true);
    setError("");
    try {
      const apiUrl = url || `${baseApiUrl}?page=${pageNumber}`;
      const res = await fetchWithAuth(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch quotes");
      const data = await res.json();
      setQuotes(data.results || []);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      if (!url) setPage(pageNumber);
    } catch (err) {
      setError("Failed to load quotes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotes(undefined, page);
  }, [page]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  async function updateStatus(id: number) {
  const newStatus = editingStatusIds[id];
  if (!newStatus) return;

  try {
    const res = await fetchWithAuth(`${baseApiUrl}${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(`Failed to update status: ${JSON.stringify(err)}`);
      return;
    }
    setQuotes((curr) =>
      curr.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
    );
    setEditingStatusIds((curr) => {
      const updated = { ...curr };
      delete updated[id];
      return updated;
    });
  } catch (err) {
    alert("Network error updating status");
    console.error(err);
  }
  }


  const handlePrevPage = () => {
    if (prevPageUrl) {
      loadQuotes(prevPageUrl);
      setPage((p) => Math.max(1, p - 1));
    }
  };

  const handleNextPage = () => {
    if (nextPageUrl) {
      loadQuotes(nextPageUrl);
      setPage((p) => p + 1);
    }
  };

  const handleStatusChange = (id: number, newStatus: QuoteStatus) => {
  setEditingStatusIds((curr) => ({ ...curr, [id]: newStatus }));
  };


  const deleteQuote = async (id: number) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;

    try {
      const res = await fetchWithAuth(`${baseApiUrl}${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete quote");
      setQuotes((curr) => curr.filter((q) => q.id !== id));
    } catch (err) {
      alert("Failed to delete quote");
      console.error(err);
    }
  };

  const getStatusStyle = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-700 border border-gray-300";
    switch (status.toLowerCase()) {
      case "draft":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "sent":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "accepted":
        return "bg-green-100 text-green-700 border border-green-300";
      case "rejected":
        return "bg-red-100 text-red-700 border border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  if (loading) return <div className="text-center p-6 text-green-700 font-semibold">
          Loading Quotes...
        </div>
  if (error) return <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>

  return (
    <div className="min-h-screen p-6 bg-[#f3fdf5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">All Quotes</h1>
        <Link
          href="/books/sales/quotes/new"
          className="flex items-center gap-2 px-5 py-2 font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700"
        >
          <Plus size={16} /> New
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-green-100 shadow-sm rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-green-200 text-green-900">
            <tr>
              <th className="px-4 py-3 font-semibold text-left">Date</th>
              <th className="px-4 py-3 font-semibold text-left">Quote Number</th>
              <th className="px-4 py-3 font-semibold text-left">Customer</th>
              <th className="px-4 py-3 font-semibold text-left">Expiry Date</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-right">Created_at</th>
              <th className="px-4 py-3 font-semibold text-left">Status</th>
              <th className="px-4 py-3 font-semibold text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
  {quotes.length === 0 ? (
    <tr>
      <td colSpan={8} className="p-4 text-center text-gray-500 bg-white">
        No quotes found
      </td>
    </tr>
  ) : (
    quotes.map((q) => {
      const editing = q.id in editingStatusIds;
      return (
        <tr key={q.id} className="transition border-b hover:bg-green-50">
          <td className="px-4 py-3">{formatDate(q.quote_date)}</td>
          <td className="px-4 py-3 font-medium text-green-700">
            <Link href={`/books/sales/quotes/${q.id}`}>{q.quote_number}</Link>
          </td>
          <td className="px-4 py-3">{q.customer.display_name}</td>
          <td className="px-4 py-3">{formatDate(q.expiry_date)}</td>
          <td className="px-4 py-3 font-medium text-right">₹{q.total_amount}</td>
          <td className="px-5 py-3 text-right">
            {new Date(q.created_at).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </td>
          <td className="px-4 py-3">
            {editing ? (
              <select
                value={editingStatusIds[q.id]}
                onChange={(e) =>
                  handleStatusChange(q.id, e.target.value as QuoteStatus)
                }
                className="rounded border px-2 py-1"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                  q.status
                )}`}
              >
                {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
              </span>
            )}
          </td>
          <td className="px-4 py-3 flex gap-2 items-center">
            {editing ? (
              <>
                <button
                  onClick={() => updateStatus(q.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() =>
                    setEditingStatusIds((curr) => {
                      const updated = { ...curr };
                      delete updated[q.id];
                      return updated;
                    })
                  }
                  className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() =>
                    setEditingStatusIds((curr) => ({
                      ...curr,
                      [q.id]: q.status,
                    }))
                  }
                  className="px-3 py-1 border rounded text-blue-600 hover:bg-blue-100"
                  title="Edit Status"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuote(q.id)}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Delete quote"
                  title="Delete quote"
                >
                  <FaTrash />
                </button>
                <button
                  onClick={() => router.push(`/books/sales/quotes/toProforma/${q.id}`)}
                  className="px-3 py-1 border rounded text-purple-600 hover:bg-purple-100"
                  title="Convert to Proforma"
                >
                  <LuMerge />
                </button>
              </>
            )}
          </td>
        </tr>
      );
    })
  )}
</tbody>

        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <span>
          Showing {quotes.length} quote{quotes.length !== 1 ? "s" : ""}
        </span>
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
    </div>
  );
}
