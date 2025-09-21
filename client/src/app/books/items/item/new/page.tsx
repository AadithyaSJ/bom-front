"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

interface Vendor {
  id: number;
  display_name: string;
}

interface NewItemPayload {
  name: string;
  unit: "Nos" | "Kgs" | "Litres";
  manage_sales_info: boolean;
  sales_selling_price?: number;
  sales_account?: string;
  sales_description?: string;
  manage_purchase_info: boolean;
  purchase_cost_price?: number;
  purchase_account?: string;
  purchase_description?: string;
  preferred_vendor?: number | null;
  track_inventory: boolean;
  inventory_account?: string;
  inventory_valuation_method?: string;
  opening_stock?: number;
  opening_stock_rate_per_unit?: number;
  reorder_point?: number;
}

export default function NewItemPage() {
  const router = useRouter();

  // Units fixed list
  const units = ["Nos", "Kgs", "Litres"] as const;

  // Vendors from API
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Checkbox states for managing included info
  const [manageSalesInfo, setManageSalesInfo] = useState(false);
  const [managePurchaseInfo, setManagePurchaseInfo] = useState(false);
  const [trackInventory, setTrackInventory] = useState(false);

  // Form state with proper initial values as strings (for form inputs)
  const [form, setForm] = useState({
    name: "",
    unit: "",
    description: "",
    price: "",
    sku: "",
    // sales info
    sales_selling_price: "",
    sales_account: "Sales",
    sales_description: "",
    // purchase info
    purchase_cost_price: "",
    purchase_account: "Cost of Goods Sold",
    purchase_description: "",
    preferred_vendor: "", // will hold vendor id as string
    // inventory info
    inventory_account: "",
    inventory_valuation_method: "",
    opening_stock: "",
    opening_stock_rate_per_unit: "",
    reorder_point: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await fetchWithAuth(
          "https://bom-front-production.up.railway.app/api/vendors/"
        );
        if (!res.ok) throw new Error("Failed to load vendors");
        const data = await res.json();
        setVendors(data.results || []);
      } catch {
        // optional: handle error or silently fail
      }
    }
    fetchVendors();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange =
    (field: "manageSalesInfo" | "managePurchaseInfo" | "trackInventory") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      if (field === "manageSalesInfo") setManageSalesInfo(checked);
      else if (field === "managePurchaseInfo") setManagePurchaseInfo(checked);
      else if (field === "trackInventory") setTrackInventory(checked);
    };

  const handleSave = async () => {
    setError("");

    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!form.unit.trim()) {
      setError("Unit is required");
      return;
    }

    // Build payload with type safety and parsing numeric fields
    const payload: NewItemPayload = {
      name: form.name.trim(),
      unit: form.unit as NewItemPayload["unit"],
      manage_sales_info: manageSalesInfo,
      manage_purchase_info: managePurchaseInfo,
      track_inventory: trackInventory,
    };

    if (manageSalesInfo) {
      if (!form.sales_selling_price) {
        setError("Sales selling price is required when Sales Info enabled");
        return;
      }
      payload.sales_selling_price = Number(form.sales_selling_price);
      payload.sales_account = form.sales_account || "Sales";
      payload.sales_description = form.sales_description.trim();
    }

    if (managePurchaseInfo) {
      if (!form.purchase_cost_price) {
        setError("Purchase cost price is required when Purchase Info enabled");
        return;
      }
      payload.purchase_cost_price = Number(form.purchase_cost_price);
      payload.purchase_account = form.purchase_account || "Cost of Goods Sold";
      payload.purchase_description = form.purchase_description.trim();
      payload.preferred_vendor = form.preferred_vendor
        ? Number(form.preferred_vendor)
        : null;
    }

    if (trackInventory) {
      payload.inventory_account = form.inventory_account.trim();
      payload.inventory_valuation_method = form.inventory_valuation_method.trim();
      payload.opening_stock = form.opening_stock
        ? Number(form.opening_stock)
        : undefined;
      payload.opening_stock_rate_per_unit = form.opening_stock_rate_per_unit
        ? Number(form.opening_stock_rate_per_unit)
        : undefined;
      payload.reorder_point = form.reorder_point
        ? Number(form.reorder_point)
        : undefined;
    }

    try {
      setLoading(true);
      const res = await fetchWithAuth(
        "https://bom-front-production.up.railway.app/api/items/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.detail || "Failed to create item");
      }
      // Success: redirect to items list page
      router.push("/books/items/item");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-5xl p-8 bg-white shadow-lg rounded-2xl">
        <h1 className="mb-6 text-2xl font-semibold text-green-700">New Item</h1>

        {error && <div className="mb-4 text-red-600 font-medium">{error}</div>}

        {/* Name & Unit */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
          <div>
            <label className="block font-medium text-gray-700">
              Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700">
              Unit<span className="text-red-500">*</span>
            </label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select unit</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Manage Sales Info */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-4 font-semibold text-green-700">
            <input
              type="checkbox"
              checked={manageSalesInfo}
              onChange={handleCheckboxChange("manageSalesInfo")}
              className="text-green-600"
            />
            Sales Information
          </label>
          {manageSalesInfo && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block font-medium text-gray-700">
                  Selling Price (INR)<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="sales_selling_price"
                  value={form.sales_selling_price}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700">Account</label>
                <select
                  name="sales_account"
                  value={form.sales_account}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Sales">Sales</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-gray-700">Description</label>
                <textarea
                  name="sales_description"
                  value={form.sales_description}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Manage Purchase Info */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-4 font-semibold text-green-700">
            <input
              type="checkbox"
              checked={managePurchaseInfo}
              onChange={handleCheckboxChange("managePurchaseInfo")}
              className="text-green-600"
            />
            Purchase Information
          </label>
          {managePurchaseInfo && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block font-medium text-gray-700">
                  Cost Price (INR)<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="purchase_cost_price"
                  value={form.purchase_cost_price}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700">Account</label>
                <select
                  name="purchase_account"
                  value={form.purchase_account}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Cost of Goods Sold">Cost of Goods Sold</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-gray-700">Description</label>
                <textarea
                  name="purchase_description"
                  value={form.purchase_description}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700">Preferred Vendor</label>
                <select
                  name="preferred_vendor"
                  value={form.preferred_vendor}
                  onChange={handleChange}
                  className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id.toString()}>
                      {v.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Track Inventory */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-4 font-semibold text-green-700">
            <input
              type="checkbox"
              checked={trackInventory}
              onChange={handleCheckboxChange("trackInventory")}
              className="text-green-600"
            />
            Track Inventory for this item
          </label>
          {trackInventory && (
            <>
              <p className="mb-4 text-sm text-gray-500">
                You cannot enable/disable inventory tracking once you've created transactions for this item
              </p>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block font-medium text-gray-700">Inventory Account</label>
                  <select
                    name="inventory_account"
                    value={form.inventory_account}
                    onChange={handleChange}
                    className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select an account</option>
                    <option value="Inventory">Inventory</option>
                    {/* Add more accounts as you like */}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Inventory Valuation Method</label>
                  <select
                    name="inventory_valuation_method"
                    value={form.inventory_valuation_method}
                    onChange={handleChange}
                    className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Method</option>
                    <option value="FIFO">FIFO</option>
                    <option value="LIFO">LIFO</option>
                    {/* Add more methods if needed */}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Opening Stock</label>
                  <input
                    type="number"
                    name="opening_stock"
                    value={form.opening_stock}
                    onChange={handleChange}
                    className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Opening Stock Rate per Unit</label>
                  <input
                    type="number"
                    name="opening_stock_rate_per_unit"
                    value={form.opening_stock_rate_per_unit}
                    onChange={handleChange}
                    className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700">Reorder Point</label>
                  <input
                    type="number"
                    name="reorder_point"
                    value={form.reorder_point}
                    onChange={handleChange}
                    className="w-full p-2 mt-2 border border-black rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.push("/books/items/item")}
            className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleSave}
            className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
