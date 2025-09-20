"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/auth/tokenservice";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

type CustomerType = {
  id: number;
  display_name: string;
  email?: string;
  company_name?: string;
};

type ChallanStatus = "draft" | "issued" | "dispatched" | "delivered" | "cancelled" | "returned";

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED" | "PARTIAL" | "OVERDUE";

type Challan = {
  id: string;
  customer: CustomerType;
  challan_number: string;
  reference_number: string;
  date: string;
  delivery_date?: string;
  status: ChallanStatus;
  notes?: string;
  related_invoice?: {
    id: string;
    status: InvoiceStatus;
  };
};

export default function ChallanPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  // Editable statuses
  const [editingChallanStatusIds, setEditingChallanStatusIds] = useState<Record<string, ChallanStatus>>({});
  const [editingInvoiceStatusIds, setEditingInvoiceStatusIds] = useState<Record<string, InvoiceStatus>>({});

  const challanStatusOptions: ChallanStatus[] = ["draft", "issued", "dispatched", "delivered", "cancelled", "returned"];
  const invoiceStatusOptions: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "CANCELLED", "PARTIAL", "OVERDUE"];

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/invoices/");
        if (!res.ok) throw new Error("Failed to fetch invoices");
        const data = await res.json();
        setInvoices(data.results || []);
      } catch (err) {
        console.error("Failed to load invoices", err);
      }
    }
    loadInvoices();
  }, []);

  async function loadChallans(url?: string, pageNumber = 1) {
    setLoading(true);
    setError("");
    try {
      const apiUrl = url || `https://bom-front-production.up.railway.app/api/deliverychallans/?page=${pageNumber}`;
      const res = await fetchWithAuth(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch challans");
      const data = await res.json();
      setChallans(data.results || []);
      setNextPageUrl(data.next || null);
      setPrevPageUrl(data.previous || null);
      if (!url) setPage(pageNumber);
    } catch (err) {
      setError("Failed to load challans");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChallans(undefined, page);
  }, [page]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-yellow-300 text-yellow-900";
      case "SENT":
        return "bg-blue-300 text-blue-900";
      case "ACCEPTED":
      case "PAID":
        return "bg-green-300 text-green-900";
      case "REJECTED":
      case "CANCELLED":
        return "bg-red-300 text-red-900";
      case "PARTIAL":
        return "bg-orange-300 text-orange-900";
      case "OVERDUE":
        return "bg-pink-300 text-pink-900";
      default:
        return "bg-gray-300 text-gray-900";
    }
  };

  async function updateChallanStatus(id: string) {
    const newStatus = editingChallanStatusIds[id];
    if (!newStatus) return;
    try {
      const res = await fetchWithAuth(`https://bom-front-production.up.railway.app/api/deliverychallans/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Failed to update challan status: " + JSON.stringify(err));
        return;
      }
      setChallans((curr) => curr.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
      setEditingChallanStatusIds((curr) => {
        const copy = { ...curr };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      alert("Network error updating challan status");
      console.error(err);
    }
  }

  async function updateInvoiceStatus(id: string) {
    const newStatus = editingInvoiceStatusIds[id];
    if (!newStatus) return;
    try {
      const res = await fetchWithAuth(`https://bom-front-production.up.railway.app/api/invoices/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Failed to update invoice status: " + JSON.stringify(err));
        return;
      }
      setInvoices((curr) => curr.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv)));
      setEditingInvoiceStatusIds((curr) => {
        const copy = { ...curr };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      alert("Network error updating invoice status");
      console.error(err);
    }
  }

  const handlePrevPage = () => {
    if (prevPageUrl) loadChallans(prevPageUrl);
  };

  const handleNextPage = () => {
    if (nextPageUrl) loadChallans(nextPageUrl);
  };

  if (loading) return <p>Loading challans...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-[#f3fdf5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">All Delivery Challans</h1>
        <Link href="/books/sales/challans/new">
          <button className="flex items-center gap-2 px-5 py-2 font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700">
            <Plus size={16} /> New
          </button>
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white border border-green-100 shadow-sm rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-green-200 text-green-900">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Challan #</th>
              <th className="px-4 py-3 text-left">Reference #</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Invoice Status</th>
            </tr>
          </thead>
          <tbody>
            {challans.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No challans found. Click <b>+ New</b> to create one.
                </td>
              </tr>
            ) : (
              challans.map((challan) => {
                const editingChallan = challan.id in editingChallanStatusIds;
                const relatedInvoice = invoices.find((inv) => inv.customer.id === challan.customer.id);
                const editingInvoice = relatedInvoice && relatedInvoice.id in editingInvoiceStatusIds;

                return (
                  <tr key={challan.id} className="transition border-b hover:bg-green-50">
                    <td className="px-4 py-3">{formatDate(challan.date)}</td>
                    <td className="px-4 py-3 font-medium text-green-700">
                      <Link href={`/books/sales/challans/${challan.id}`} className="hover:underline">
                        {challan.challan_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{challan.reference_number}</td>
                    <td className="px-4 py-3">{challan.customer.display_name}</td>
                    <td className="px-4 py-3">
                      {editingChallan ? (
                        <>
                          <select
                            value={editingChallanStatusIds[challan.id]}
                            onChange={(e) =>
                              setEditingChallanStatusIds((curr) => ({
                                ...curr,
                                [challan.id]: e.target.value as ChallanStatus,
                              }))
                            }
                            className="border border-green-400 rounded px-2 py-1"
                          >
                            {challanStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <button onClick={() => updateChallanStatus(challan.id)} className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                            Save
                          </button>
                          <button
                            onClick={() =>
                              setEditingChallanStatusIds((curr) => {
                                const copy = { ...curr };
                                delete copy[challan.id];
                                return copy;
                              })
                            }
                            className="ml-2 px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(challan.status)}`}>
                            {challan.status}
                          </span>
                          <button
                            onClick={() =>
                              setEditingChallanStatusIds((curr) => ({ ...curr, [challan.id]: challan.status }))
                            }
                            className="ml-2 px-3 py-1 border rounded text-blue-600 hover:bg-blue-100"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {relatedInvoice ? (
                        editingInvoice ? (
                          <>
                            <select
                              value={editingInvoiceStatusIds[relatedInvoice.id]}
                              onChange={(e) =>
                                setEditingInvoiceStatusIds((curr) => ({
                                  ...curr,
                                  [relatedInvoice.id]: e.target.value as InvoiceStatus,
                                }))
                              }
                              className="border border-green-400 rounded px-2 py-1"
                            >
                              {invoiceStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <button onClick={() => updateInvoiceStatus(relatedInvoice.id)} className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                              Save
                            </button>
                            <button
                              onClick={() =>
                                setEditingInvoiceStatusIds((curr) => {
                                  const copy = { ...curr };
                                  delete copy[relatedInvoice.id];
                                  return copy;
                                })
                              }
                              className="ml-2 px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(relatedInvoice.status)}`}>
                              {relatedInvoice.status}
                            </span>
                            <button
                              onClick={() =>
                                setEditingInvoiceStatusIds((curr) => ({
                                  ...curr,
                                  [relatedInvoice.id]: relatedInvoice.status,
                                }))
                              }
                              className="ml-2 px-3 py-1 border rounded text-blue-600 hover:bg-blue-100"
                            >
                              Edit
                            </button>
                          </>
                        )
                      ) : (
                        "-"
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
          Showing {challans.length} challan{challans.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-1">
          <button
            disabled={!prevPageUrl}
            onClick={handlePrevPage}
            className={`flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:bg-green-50 transition ${!prevPageUrl ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button className="border px-3 py-1.5 rounded-lg bg-green-600 text-white shadow-sm">{page}</button>
          <button
            disabled={!nextPageUrl}
            onClick={handleNextPage}
            className={`flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:bg-green-50 transition ${!nextPageUrl ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
