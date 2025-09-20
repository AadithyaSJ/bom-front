"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FaTrash, FaEdit } from "react-icons/fa"; // import at top

type CustomerType = {
  id: number;
  display_name: string;
  email: string;
  company_name: string;
  address: string;
  phone: string;
  created_at: string;
};

type ProformaStatus = "draft" | "sent" | "accepted" | "rejected";

type ProformaInvoice = {
  id: string;
  customer: CustomerType;
  invoice_number: string;
  invoice_date: string; // ISO date
  due_date : string;
  total_amount: string | number;
  status: ProformaStatus;
  notes: string;
  created_at: string;
};


export default function ProformaInvoicesPage() {
  const [proformas, setProformas] = useState<ProformaInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const baseApiUrl = "https://bom-front-production.up.railway.app/api/proformainvoices/";

  const deleteProforma = async (id: string) => {
  if (!confirm("Are you sure you want to delete this proforma invoice?")) return;

  try {
    const res = await fetchWithAuth(`https://bom-front-production.up.railway.app/api/proformainvoices/${id}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete proforma invoice");
    setProformas(curr => curr.filter(inv => inv.id !== id));
  } catch (err) {
    alert("Failed to delete proforma invoice");
    console.error(err);
  }
};


  async function loadProformas(url?: string, pageNumber = 1) {
    setLoading(true);
    setError("");
    try {
      const apiUrl = url || `${baseApiUrl}?page=${pageNumber}`;
      const res = await fetchWithAuth(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch proforma invoices");
      const data = await res.json();
      setProformas(data.results || []);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      if (!url) setPage(pageNumber);
    } catch (err) {
      setError("Failed to load proforma invoices");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProformas(undefined, page);
  }, [page]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const handlePrevPage = () => {
    if (prevPageUrl) {
      loadProformas(prevPageUrl);
      setPage((p) => Math.max(1, p - 1));
    }
  };

  const handleNextPage = () => {
    if (nextPageUrl) {
      loadProformas(nextPageUrl);
      setPage((p) => p + 1);
    }
  };

  if (loading) return <p>Loading proforma invoices...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-800">All Proforma Invoices</h1>
        <Link
          href="/books/sales/proforma-invoice/new"
          className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
        >
          + New
        </Link>
      </div>

      <div className="overflow-hidden shadow rounded-xl">
        <table className="w-full border-collapse">
          <thead className="text-green-900 bg-green-200">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Invoice Number</th>
              <th className="p-3 text-left">Customer Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {proformas.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500 bg-white">
                  No proforma invoices found
                </td>
              </tr>
            ) : (
              proformas.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className={`${idx % 2 ? "bg-green-100" : "bg-green-50"} border-b`}
                >
                  <td className="p-3">{formatDate(inv.invoice_date)}</td>
                  <td className="p-3">
                    <Link href={`/books/sales/proforma-invoice/${inv.id}`} className="hover:underline text-green-700 font-medium">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="p-3">{inv.customer.display_name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        inv.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : inv.status === "sent"
                          ? "bg-blue-100 text-blue-800"
                          : inv.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3">₹{Number(inv.total_amount).toLocaleString()}</td>
                  <td className="p-3 flex gap-3">
                    <Link
    href={`/books/sales/proforma-invoice/${inv.id}/edit`}
    className="text-blue-600 hover:text-blue-800"
    title="Edit proforma invoice"
    aria-label={`Edit proforma invoice ${inv.invoice_number}`}
  >
    <FaEdit />
  </Link>
        <button
          onClick={() => deleteProforma(inv.id)}
          className="text-red-600 hover:text-red-800"
          aria-label="Delete proforma invoice"
          title="Delete proforma invoice"
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

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <span>
          Showing {proformas.length} proforma invoice{proformas.length !== 1 ? "s" : ""}
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
