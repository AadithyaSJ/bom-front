"use client";

import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";
import { FaTrash } from "react-icons/fa";
import { LuMerge } from "react-icons/lu";
import { useRouter } from "next/navigation";

type CustomerType = {
  id: number;
  display_name: string;
};

type InvoiceStatus = "DRAFT" | "UNPAID" | "PAID" | "CANCELLED" | "PARTIAL" |"SENT";

type Invoice = {
  id: string;
  customer: CustomerType;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number | string;
  status: InvoiceStatus;
  notes: string;
  created_at: string;
};

export default function InvoiceListPage() {
  const [statusFilter, setStatusFilter] = useState("Invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);
  const [editingStatusIds, setEditingStatusIds] = useState<Record<string, InvoiceStatus>>({});
  const router = useRouter();
  

  const baseApiUrl = "https://web-production-6baf3.up.railway.app/api/invoices/";

  const statusOptions: InvoiceStatus[] = ["DRAFT", "UNPAID" , "PAID" , "CANCELLED" , "PARTIAL", "SENT"];
  

  function getStatusColor(status?: string) {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "paid":
      case "accepted":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  async function loadInvoices(url?: string, pageNumber = 1) {
    setLoading(true);
    setError("");
    try {
      let apiUrl = url || `${baseApiUrl}?page=${pageNumber}`;
      if (statusFilter !== "Invoices" && !url) {
        apiUrl += `&status=${statusFilter.toLowerCase()}`;
      }
      const res = await fetchWithAuth(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      const data = await res.json();
      setInvoices(data.results || []);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      if (!url) setPage(pageNumber);
      setEditingStatusIds({});
    } catch (err) {
      setError("Failed to load invoices");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string) {
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
      setInvoices((curr) =>
        curr.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv))
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

  const handleStatusChange = (id: string, newStatus: InvoiceStatus) => {
    setEditingStatusIds((curr) => ({ ...curr, [id]: newStatus }));
  };

  const handlePrevPage = () => {
    if (prevPageUrl) {
      loadInvoices(prevPageUrl);
      setPage((p) => Math.max(1, p - 1));
    }
  };

  const handleNextPage = () => {
    if (nextPageUrl) {
      loadInvoices(nextPageUrl);
      setPage((p) => p + 1);
    }
  };

  async function deleteInvoice(id: string) {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetchWithAuth(`${baseApiUrl}${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");
      setInvoices((curr) => curr.filter((inv) => inv.id !== id));
    } catch {
      alert("Failed to delete invoice");
    }
  }

  useEffect(() => {
    loadInvoices(undefined, page);
  }, [statusFilter, page]);

  const formatDate = (str: string) => {
    try {
      return new Date(str).toLocaleDateString();
    } catch {
      return str;
    }
  };

  if (loading) return <div className="text-center p-6 text-green-700 font-semibold">
          Loading Invoice Details...
        </div>
  if (error) return <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>

  return (
    <div className="min-h-screen p-6 bg-[#f3fdf5]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">All Invoices</h1>
        <Link
          href="/books/sales/invoice/new"
          className="flex items-center gap-2 px-5 py-2 font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700"
        >
          <Plus size={16} /> New
        </Link>
      </div>

      <div className="overflow-hidden bg-white border border-green-100 shadow-sm rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-green-200 text-green-900">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Invoice Number</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500 bg-white">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const editing = inv.id in editingStatusIds;
                return (
                  <tr key={inv.id} className="hover:bg-green-50 border-b transition">
                    <td className="px-4 py-3">{formatDate(inv.invoice_date)}</td>
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/books/sales/invoice/${inv.id}`} className="hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{inv.customer.display_name}</td>
                    <td className="px-4 py-3">{formatDate(inv.due_date)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₹{Number(inv.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {editing ? (
                        <select
                    value={editingStatusIds[inv.id]}
                    onChange={e => handleStatusChange(inv.id, e.target.value as InvoiceStatus)}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(inv.status)}`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-2 items-center">
                      {editing ? (
                        <>
                          <button
                            onClick={() => updateStatus(inv.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() =>
                              setEditingStatusIds((curr) => {
                                const updated = { ...curr };
                                delete updated[inv.id];
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
                            onClick={() => setEditingStatusIds((curr) => ({ ...curr, [inv.id]: inv.status }))}
                            className="px-3 py-1 border rounded text-blue-600 hover:bg-blue-100"
                            title="Edit Status"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteInvoice(inv.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Invoice"
                          >
                            <FaTrash />
                          </button>
                          <button
                            onClick={() => router.push(`/books/sales/invoice/toDelivery/${inv.id}`)}
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

      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <span>
          Showing {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
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
