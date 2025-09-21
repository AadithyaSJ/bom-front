"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

interface Item {
  id: string | number;
  name: string;
  unit: "Nos" | "Kgs" | "Litres";
  manage_sales_info: boolean;
  sales_selling_price?: number | null;
  sales_account: string;
  sales_description: string;
  manage_purchase_info: boolean;
  purchase_cost_price?: number | null;
  purchase_account: string;
  purchase_description: string;
  preferred_vendor?: number | null; // Vendor id
  track_inventory: boolean;
  inventory_account: string;
  inventory_valuation_method: string;
  opening_stock?: number | null;
  opening_stock_rate_per_unit?: number | null;
  reorder_point?: number | null;
  current_stock: number;
  created_at: string;  // ISO datetime string
}

interface Vendor {
  id: string | number;
  vendor_type: "business" | "individual";
  salutation?: "dr" | "mr" | "ms" | "mrs" | null;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  display_name: string;
  email: string;
  work_phone?: string;
  mobile?: string;
  pan?: string;
  currency: "AED" | "AUD" | "BND" | "CAD" | "CNY" | "EUR" | "GBP" | "INR" | "JPY" | "SAR" | "USD" | "ZAR";
  opening_balance: number;
  current_balance: number;
  payment_terms: "due_on_receipt" | "net_7" | "net_15" | "net_30" | "net_45";
  billing_attention?: string;
  billing_country?: string;
  billing_street1?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_pin_code?: string;
  billing_phone?: string;
  billing_fax?: string;
  shipping_attention?: string;
  shipping_country?: string;
  shipping_street1?: string;
  shipping_street2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pin_code?: string;
  shipping_phone?: string;
  shipping_fax?: string;
  custom_fields?: Record<string, unknown>;
  tags?: string[];
  remarks?: string;
  created_at: string; // ISO datetime string
}



export default function EditItemPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const units = ["Nos", "Kgs", "Litres"];

  // Fetch item
  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetchWithAuth(
          `https://bom-front-production.up.railway.app/api/items/${id}/`
        );
        if (!res.ok) throw new Error("Failed to fetch item data");
        const data = await res.json();
        setItem(data);
        const vRes = await fetchWithAuth(
          `https://bom-front-production.up.railway.app/api/vendors/`
        );
        if (!vRes.ok) throw new Error("Failed to fetch vendors");
        const vData = await vRes.json();
        setVendors(vData.results || []); 
      } catch (err) {
        setError("Failed to load item");
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetchWithAuth(
        `https://bom-front-production.up.railway.app/api/items/${id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }
      );
      if (!res.ok) throw new Error("Failed to update item");
      router.push(`/books/items/item/${id}`); // back to detail page
    } catch (err) {
      alert("Error updating item");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading item...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow mt-8">
      <h2 className="text-xl font-semibold mb-4">Edit Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
  {/* Name */}
  <div>
    <label className="block text-sm font-medium">Name</label>
    <input
      type="text"
      value={item.name || ""}
      onChange={(e) => setItem({ ...item, name: e.target.value })}
      className="w-full border px-3 py-2 rounded"
    />
  </div>

  {/* Unit */}
  <div>
  <label className="block text-sm font-medium">Unit</label>
  <select
    value={item.unit || ""}
    onChange={(e) => setItem({ ...item, unit: e.target.value })}
    className="w-full border px-3 py-2 rounded"
  >
    <option value="">-- Select Unit --</option>
    <option value="Nos">Nos</option>
    <option value="Kgs">Kgs</option>
    <option value="Litres">Litres</option>
  </select>
</div>

  {/* Manage Sales Info */}
  <div>
    <label className="inline-flex items-center">
      <input
        type="checkbox"
        checked={item.manage_sales_info || false}
        onChange={(e) =>
          setItem({ ...item, manage_sales_info: e.target.checked })
        }
        className="mr-2"
      />
      Manage Sales Info
    </label>
  </div>

  {/* Sales Selling Price */}
  <div>
    <label className="block text-sm font-medium">Sales Selling Price</label>
    <input
      type="number"
      step="0.01"
      value={item.sales_selling_price || ""}
      onChange={(e) =>
        setItem({ ...item, sales_selling_price: e.target.value })
      }
      className="w-full border px-3 py-2 rounded"
    />
  </div>

  {/* Sales Account */}
  {/* Sales Account */}
<div>
  <label className="block text-sm font-medium">Sales Account</label>
  <select
    value={item.sales_account || ""}
    onChange={(e) => setItem({ ...item, sales_account: e.target.value })}
    className="w-full border px-3 py-2 rounded"
  >
    <option value="">-- Select Sales Account --</option>
    <option value="Sales">Sales</option>
  </select>
</div>

  {/* Sales Description */}
  <div>
    <label className="block text-sm font-medium">Sales Description</label>
    <textarea
      value={item.sales_description || ""}
      onChange={(e) =>
        setItem({ ...item, sales_description: e.target.value })
      }
      className="w-full border px-3 py-2 rounded"
    />
  </div>

  {/* Manage Purchase Info */}
  <div>
    <label className="inline-flex items-center">
      <input
        type="checkbox"
        checked={item.manage_purchase_info || false}
        onChange={(e) =>
          setItem({ ...item, manage_purchase_info: e.target.checked })
        }
        className="mr-2"
      />
      Manage Purchase Info
    </label>
  </div>

  {/* Purchase Cost Price */}
  <div>
    <label className="block text-sm font-medium">Purchase Cost Price</label>
    <input
      type="number"
      step="0.01"
      value={item.purchase_cost_price || ""}
      onChange={(e) =>
        setItem({ ...item, purchase_cost_price: e.target.value })
      }
      className="w-full border px-3 py-2 rounded"
    />
  </div>

  {/* Purchase Account */}
  <div>
  <label className="block text-sm font-medium">Purchase Account</label>
  <select
    value={item.purchase_account || ""}
    onChange={(e) => setItem({ ...item, purchase_account: e.target.value })}
    className="w-full border px-3 py-2 rounded"
  >
    <option value="">-- Select Purchase Account --</option>
    <option value="Cost of Goods Sold">Cost of Goods Sold</option>
  </select>
</div>

  {/* Purchase Description */}
  <div>
    <label className="block text-sm font-medium">Purchase Description</label>
    <textarea
      value={item.purchase_description || ""}
      onChange={(e) =>
        setItem({ ...item, purchase_description: e.target.value })
      }
      className="w-full border px-3 py-2 rounded"
    />
  </div>

  {/* Preferred Vendor */}
  <div>
          <label className="block text-sm font-medium">Preferred Vendor</label>
          <select
            value={item.preferred_vendor || ""}
            onChange={(e) =>
              setItem({ ...item, preferred_vendor: Number(e.target.value) })
            }
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">-- Select Vendor --</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.display_name}
              </option>
            ))}
          </select>
        </div>

  {/* Track Inventory */}
  <div>
    <label className="inline-flex items-center">
      <input
        type="checkbox"
        checked={item.track_inventory || false}
        onChange={(e) =>
          setItem({ ...item, track_inventory: e.target.checked })
        }
        className="mr-2"
      />
      Track Inventory
    </label>
  </div>

  {/* Inventory Account */}
  <div>
    <label className="block text-sm font-medium">Inventory Account</label>
    <input
      type="text"
      value={item.inventory_account || ""}
      onChange={(e) =>
        setItem({ ...item, inventory_account: e.target.value })
      }
      className="w-full border px-3 py-2 rounded"
    />
  </div>

  {/* Inventory Valuation Method */}
  <div>
    <label className="block text-sm font-medium">Inventory Valuation Method</label>
    <input
      type="text"
      value={item.inventory_valuation_method || ""}
      onChange={(e) =>
        setItem({ ...item, inventory_valuation_method: e.target.value })
      }
      className="w-full border px-3 py-2 rounded"
    />
  </div>

  {/* Opening Stock */}
  <div>
    <label className="block text-sm font-medium">Opening Stock</label>
    <input
      type="number"
      step="0.01"
      value={item.opening_stock || ""}
      onChange={(e) =>
        setItem({ ...item, opening_stock: e.target.value })
      }
      className="w-full border px-3 py-2 rounded"
    />
  </div>

  {/* Opening Stock Rate per Unit */}
  <div>
    <label className="block text-sm font-medium">Opening Stock Rate/Unit</label>
    <input
      type="number"
      step="0.01"
      value={item.opening_stock_rate_per_unit || ""}
      onChange={(e) =>
        setItem({ ...item, opening_stock_rate_per_unit: e.target.value })
      }
      className="w-full border px-3 py-2 rounded"
    />
  </div>

  {/* Reorder Point */}
  <div>
    <label className="block text-sm font-medium">Reorder Point</label>
    <input
      type="number"
      step="0.01"
      value={item.reorder_point || ""}
      onChange={(e) =>
        setItem({ ...item, reorder_point: e.target.value })
      }
      className="w-full border px-3 py-2 rounded"
    />
  </div>

  {/* Buttons */}
  <div className="flex gap-4">
    <button
      type="submit"
      disabled={saving}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      {saving ? "Saving..." : "Save"}
    </button>
    <button
      type="button"
      onClick={() => router.push(`/books/items/item/${id}`)}
      className="border px-4 py-2 rounded"
    >
      Cancel
    </button>
  </div>
</form>

    </div>
  );
}
