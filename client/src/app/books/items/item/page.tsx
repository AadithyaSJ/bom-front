"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { Trash2 } from "lucide-react";

interface Item {
  id: string | number;
  name: string;
  unit: "Nos" | "Kgs" | "Litres";   // Based on UNIT_CHOICES in Django
  managesalesinfo: boolean;
  salessellingprice?: number | null;
  salesaccount: string;
  salesdescription: string;
  managepurchaseinfo: boolean;
  purchasecostprice?: number | null;
  purchaseaccount: string;
  purchasedescription: string;
  preferredvendor?: number | null; // Assuming foreign key represented as id
  trackinventory: boolean;
  inventoryaccount: string;
  inventoryvaluationmethod: string;
  openingstock?: number | null;
  openingstockrateperunit?: number | null;
  reorderpoint?: number | null;
  currentstock: number;
  createdat: string;  // ISO string date
}


export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchItems() {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/items/");

      if (!res.ok) {
        throw new Error("Failed to fetch items");
      }
      const data = await res.json();
      setItems(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetchWithAuth(
        `https://web-production-6baf3.up.railway.app/api/items/${id}/`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Failed to delete item");
      }

      // Remove deleted item from local state
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">All Items</h1>
        <button
          className="px-4 py-2 font-medium text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
          onClick={() => router.push("/books/items/item/new")}
        >
          + New
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-green-700">Loading items...</div>
      ) : error ? (
        <div className="text-center py-10 text-red-600">Error: {error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-green-700">No items found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse rounded-lg shadow">
            <thead>
              <tr className="font-semibold text-green-900 bg-green-200">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Purchase Description</th>
                <th className="px-4 py-3">Purchase Rate</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Stock on Hand</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}
                  className={`cursor-pointer ${
                    item.id % 2 === 0 ? "bg-green-50" : "bg-green-100"
                    } hover:bg-green-200`}
                  onClick={() => router.push(`/books/items/item/${item.id}`)} // 👈 Navigate to detail page
                  >
                  <td className="px-4 py-3 font-medium text-green-700">{item.name}</td>
                  <td className="px-4 py-3">{item.purchase_description || "-"}</td>
                  <td className="px-4 py-3">
                    {item.purchase_cost_price != null
                      ? `₹${Number(item.purchase_cost_price).toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {item.sales_selling_price != null ? `₹${Number(item.sales_selling_price).toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-3">{item.opening_stock ?? "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 rounded hover:bg-red-100"
                      title="Delete item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
