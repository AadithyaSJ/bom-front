"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { FaTrash } from "react-icons/fa";
import { fetchWithAuth } from "@/auth/tokenservice";

type Vendor = {
  id: number;
  display_name: string;
  company_name: string;
  email: string;
  mobile: string;
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [prevPageUrl, setPrevPageUrl] = useState<string | null>(null);

  const baseApiUrl =
    "https://web-production-6baf3.up.railway.app/api/vendors/";

  async function loadVendors(url?: string, pageNumber = 1) {
    setLoading(true);
    setError("");
    try {
      const apiUrl = url || `${baseApiUrl}?page=${pageNumber}`;
      const res = await fetchWithAuth(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const data = await res.json();
      setVendors(data.results || []);
      setNextPageUrl(data.next);
      setPrevPageUrl(data.previous);
      if (!url) setPage(pageNumber);
    } catch (err) {
      setError("Failed to load vendors");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors(undefined, page);
  }, [page]);

  const deleteVendor = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      const res = await fetchWithAuth(`${baseApiUrl}${id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setVendors((curr) => curr.filter((v) => v.id !== id));
    } catch (err) {
      alert("Failed to delete vendor");
      console.error(err);
    }
  };

  const handlePrevPage = () => {
    if (prevPageUrl) {
      loadVendors(prevPageUrl);
      setPage((p) => Math.max(1, p - 1));
    }
  };

  const handleNextPage = () => {
    if (nextPageUrl) {
      loadVendors(nextPageUrl);
      setPage((p) => p + 1);
    }
  };

  if (loading) return <p>Loading vendors...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-[#f3fdf5]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">Vendors</h1>
        <Link
          href="/books/purchase/vendors/new"
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
              <th className="px-4 py-3 font-semibold text-left">Name</th>
              <th className="px-4 py-3 font-semibold text-left">Company</th>
              <th className="px-4 py-3 font-semibold text-left">Email</th>
              <th className="px-4 py-3 font-semibold text-left">Phone</th>
              <th className="px-4 py-3 font-semibold text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-gray-500 bg-white"
                >
                  No vendors found
                </td>
              </tr>
            ) : (
              vendors.map((v) => (
                <tr
                  key={v.id}
                  className="transition border-b hover:bg-green-50"
                >
                  <td className="px-4 py-3 font-medium text-green-700">
                    <Link
                      href={`/books/purchase/vendors/${v.id}`}
                      className="hover:underline"
                    >
                      {v.display_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{v.company_name}</td>
                  <td className="px-4 py-3">{v.email}</td>
                  <td className="px-4 py-3">{v.mobile}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteVendor(v.id)}
                      className="text-red-600 hover:text-red-800"
                      aria-label="Delete vendor"
                      title="Delete vendor"
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
        <span>
          Showing {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}
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
