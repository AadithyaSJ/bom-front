"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

type Vendor = {
  id: number;
  display_name: string;
};

type Item = {
  id: number;
  name: string;
  unit: string;
  manage_sales_info: boolean;
  sales_selling_price?: string;
  sales_account?: string;
  sales_description?: string;
  manage_purchase_info: boolean;
  purchase_cost_price?: string;
  purchase_account?: string;
  purchase_description?: string;
  preferred_vendor?: number | null;
  track_inventory: boolean;
  inventory_account?: string;
  inventory_valuation_method?: string;
  opening_stock?: string;
  opening_stock_rate_per_unit?: string;
  reorder_point?: string;
  created_at?: string;
};

export default function ItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/items/${id}/`
        );
        if (!res.ok) throw new Error("Failed to fetch item data");
        const data: Item = await res.json();

        const resVendors = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/vendors/`
        );
        if (!resVendors.ok) throw new Error("Failed to fetch vendors");
        const vendorData = await resVendors.json();

        setItem(data);
        setVendors(vendorData.results || []);
      } catch (err) {
        setError("Failed to load item data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  if (loading) return <p>Loading item details...</p>;
  if (error || !item) return <p className="text-red-600">{error || "Item not found"}</p>;
  
  const preferredVendor = vendors.find(v => v.id === item.preferred_vendor);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-semibold text-green-800">
      Item: {item.name}
    </h2>
    <div className="flex items-center space-x-2">
      <button
        className="text-white bg-green-600 hover:bg-green-700 rounded px-4 py-1 font-semibold"
        onClick={() => router.push(`/books/items/item/${id}/edit`)}
      >
        Edit
      </button>
      <button
        className="text-green-700 border border-green-200 rounded px-4 py-1 hover:bg-green-50"
        onClick={() => router.push(`/books/items/item`)}
      >
        Back
      </button>
    </div>
  </div>

      {/* Basic Info */}
      <div className="mb-6">
        <h3 className="font-semibold text-green-700 mb-2">Basic Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-700">Unit:</span>{" "}
            <span className="text-gray-900">{item.unit}</span>
          </div>
          <div>
            <span className="text-gray-700">Created At:</span>{" "}
            <span className="text-gray-900">
              {new Date(item.created_at || "").toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Sales Info */}
      {item.manage_sales_info && (
        <div className="mt-6">
          <h3 className="font-semibold text-green-700 mb-2">Sales Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-700">Selling Price:</span>{" "}
              <span className="text-gray-900">
                ₹{parseFloat(item.sales_selling_price || "0").toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-700">Account:</span>{" "}
              <span className="text-gray-900">{item.sales_account}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-700">Description:</span>{" "}
              <span className="text-gray-900">{item.sales_description}</span>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Info */}
      {item.manage_purchase_info && (
        <div className="mt-6">
          <h3 className="font-semibold text-green-700 mb-2">Purchase Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-700">Cost Price:</span>{" "}
              <span className="text-gray-900">
                ₹{parseFloat(item.purchase_cost_price || "0").toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-700">Account:</span>{" "}
              <span className="text-gray-900">{item.purchase_account}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-700">Description:</span>{" "}
              <span className="text-gray-900">{item.purchase_description}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-700">Preffered vendor:</span>{" "}
              <span className="text-gray-900"> {preferredVendor ? preferredVendor.display_name : "—"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Info */}
      {item.track_inventory && (
        <div className="mt-6">
          <h3 className="font-semibold text-green-700 mb-2">Inventory Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-700">Inventory Account:</span>{" "}
              <span className="text-gray-900">{item.inventory_account}</span>
            </div>
            <div>
              <span className="text-gray-700">Valuation Method:</span>{" "}
              <span className="text-gray-900">{item.inventory_valuation_method}</span>
            </div>
            <div>
              <span className="text-gray-700">Opening Stock:</span>{" "}
              <span className="text-gray-900">{item.opening_stock}</span>
            </div>
            <div>
              <span className="text-gray-700">Rate per Unit:</span>{" "}
              <span className="text-gray-900">{item.opening_stock_rate_per_unit}</span>
            </div>
            <div>
              <span className="text-gray-700">Reorder Point:</span>{" "}
              <span className="text-gray-900">{item.reorder_point}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
