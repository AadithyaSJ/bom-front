"use client";

import { X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { generatePDF } from "@/lib/pdf/pdfgenerator";

type CustomerType = {
  id: number;
  display_name: string;
};

type Customer = {
  id: number;
  display_name: string;
  billing_attention: string;
  billing_street1: string;
  billing_street2: string;
  billing_city: string;
  billing_state: string;
  billing_pin_code: string;
  billing_country: string;
  billing_phone: string;
  shipping_attention: string;
  shipping_street1: string;
  shipping_street2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pin_code: string;
  shipping_country: string;
  shipping_phone: string;
};

type ItemType = {
  id: number;
  name: string;
  sales_selling_price: number | string;
};

type ChallanItem = {
  id: string;
  itemId?: number;
  name: string;
  qty: number;
  rate: number;
};

export default function NewChallanPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [challanNumber, setChallanNumber] = useState(
    `DC-${Math.floor(Date.now() / 1000) % 100000}`
  );
  const [orderNumber, setOrderNumber] = useState("");
  const [challanDate, setChallanDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [challanType, setChallanType] = useState("");

  const [itemsList, setItemsList] = useState<ItemType[]>([]);
  const [items, setItems] = useState<ChallanItem[]>([
    { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 },
  ]);

  const subTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.rate, 0),
    [items]
  );

  const taxRate = 18;
  const taxAmount = useMemo(() => (subTotal * taxRate) / 100, [subTotal]);
  const total = useMemo(() => subTotal + taxAmount, [subTotal, taxAmount]);

  // Fetch customers
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetchWithAuth(
          "https://web-production-6baf3.up.railway.app/api/customers/"
        );
        const data = await res.json();
        setCustomers(data.results || []);
      } catch (e) {
        console.error("Failed to load customers", e);
      }
    }
    fetchCustomers();
  }, []);

  // Fetch items
  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetchWithAuth(
          "https://web-production-6baf3.up.railway.app/api/items/"
        );
        const data = await res.json();
        setItemsList(data.results || []);
      } catch (e) {
        console.error("Failed to load items", e);
      }
    }
    fetchItems();
  }, []);

  // Load customer details
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomer(null);
      return;
    }
    async function loadCustomer() {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/customers/${selectedCustomerId}/`
        );
        const data = await res.json();
        setCustomer(data);
      } catch (err) {
        console.error("Failed to load customer", err);
      }
    }
    loadCustomer();
  }, [selectedCustomerId]);

  function formatAddress(cust: Customer, type: "billing" | "shipping") {
    return [
      cust[`${type}_attention` as keyof Customer],
      cust[`${type}_street1` as keyof Customer],
      cust[`${type}_street2` as keyof Customer],
      `${cust[`${type}_city` as keyof Customer]}, ${
        cust[`${type}_state` as keyof Customer]
      } ${cust[`${type}_pin_code` as keyof Customer]}`,
      cust[`${type}_country` as keyof Customer],
      cust[`${type}_phone` as keyof Customer]
        ? `Phone: ${cust[`${type}_phone` as keyof Customer]}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // --- Validation helper ---
  const validateForm = () => {
    if (!customer) {
      alert("Please select a customer");
      return false;
    }
    if (!challanType) {
      alert("Please select challan type");
      return false;
    }
    if (items.filter((i) => i.itemId).length === 0) {
      alert("Please add at least one item");
      return false;
    }
    return true;
  };

  // --- PDF Download ---
  const downloadChallan = () => {
    if (!validateForm() || !customer) return;

    const billingAddress = formatAddress(customer, "billing");
    const shippingAddress = formatAddress(customer, "shipping");

    const pdfData = {
      title: "Delivery Challan",
      documentNumber: challanNumber,
      documentDate: challanDate,
      expiryDate: challanDate,
      customerName: customer.display_name,
      billTo: billingAddress,
      shipTo: shippingAddress,
      placeOfSupply: "Chennai",
      items: items
        .filter((item) => item.itemId !== null)
        .map((item) => ({
          name: item.name,
          hsn: "-",
          qty: item.qty,
          rate: item.rate,
        })),
      subTotal,
      taxBreakup: [
        {
          label: "GST",
          pct: taxRate,
          amount: taxAmount,
        },
      ],
      total,
      totalInWords: "Indian Rupees " + total.toFixed(2) + " Only",
      notes: "",
      terms: "",
    };

    generatePDF(pdfData);
  };
  // --- Item Handlers ---
const addItem = () => {
  setItems([
    ...items,
    { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 },
  ]);
};

const removeItem = (idx: number) => {
  setItems(items.filter((_, i) => i !== idx));
};

const updateItemSelection = (idx: number, itemId: number) => {
  const selected = itemsList.find((i) => i.id === itemId);

  setItems(
    items.map((it, i) =>
      i === idx
        ? {
            ...it,
            itemId,
            name: selected?.name || "",
            rate: selected ? Number(selected.sales_selling_price) : 0, // ✅ auto-fill rate
          }
        : it
    )
  );
};


  // --- Save Challan ---
  const saveChallan = async (status: "draft" | "sent") => {
    if (!validateForm()) return;

    const payload = {
      customer_id: selectedCustomerId,
      challan_number: challanNumber,
      reference_number: orderNumber,
      date: challanDate,
      total_amount: total.toFixed(2),
      challan_type: challanType,
      status,
      item_details: items
        .filter((i) => i.itemId !== undefined)
        .map((i) => ({
          item_id: i.itemId,
          quantity: i.qty,
          rate: i.rate,
          amount: (i.qty * i.rate).toFixed(2),
        })),
    };
    try {
      const res = await fetchWithAuth(
        "https://web-production-6baf3.up.railway.app/api/deliverychallans/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to save challan: ${JSON.stringify(err)}`);
        return;
      }
      if (status === "sent") {
        downloadChallan();
      }
      alert(
        `Challan ${status === "sent" ? "sent" : "saved as draft"} successfully.`
      );
      router.push("/books/sales/challans");
    } catch (err) {
      alert("Error saving challan.");
      console.error(err);
    }
  };

  // --- UI ---
  return (
    <div className="min-h-screen p-6 bg-green-50">
      <h1 className="mb-6 text-2xl font-bold text-green-800">
        New Delivery Challan
      </h1>

      {/* Customer */}
      <div className="mb-4">
        <label className="block mb-1 text-sm font-medium text-green-800">
          Customer Name *
        </label>
        <select
          className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-green-500"
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
        >
          <option value="">Select a customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Challan Info */}
      <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
        <div>
          <label className="block mb-1 font-medium text-green-800">
            Delivery Challan#
          </label>
          <input
            type="text"
            value={challanNumber}
            className="w-full px-3 py-2 border border-green-300 rounded-lg"
            readOnly
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-green-800">
            Reference#
          </label>
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full px-3 py-2 border border-green-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-green-800">Date</label>
          <input
            type="date"
            value={challanDate}
            onChange={(e) => setChallanDate(e.target.value)}
            className="w-full px-3 py-2 border border-green-300 rounded-lg"
          />
        </div>
      </div>

      {/* Challan Type */}
      <div className="mb-6">
        <label className="block mb-1 font-medium text-green-800">
          Challan Type *
        </label>
        <select
          value={challanType}
          onChange={(e) => setChallanType(e.target.value)}
          className="w-full px-3 py-2 border border-green-300 rounded-lg"
          required
        >
          <option value="">Choose</option>
          <option value="liquid_gas">Supply of Liquid Gas</option>
          <option value="job_work">Job Work</option>
          <option value="approval">Supply on Approval</option>
          <option value="others">Others</option>
        </select>
      </div>

      {/* Items */}
      <div className="mb-6">
        <h3 className="mb-2 text-lg font-semibold text-green-800">Items</h3>
        <div className="col-span-2 overflow-hidden border rounded-lg">
        <table className="w-full border rounded-lg">
          <thead className="text-green-800 bg-green-100">
            <tr>
             <th className=" w-60 p-2 text-left">Item Details</th>
                    <th className="w-20 p-2 text-left">Qty</th>
                    <th className="w-24 p-2 text-left">Rate</th>
                    <th className="p-2 text-right w-28">Amount</th>
                    <th className="w-8 p-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">
                  <select
                    className="w-full p-1 border rounded"
                    value={item.itemId ?? ""}
                    onChange={(e) =>
                      updateItemSelection(idx, Number(e.target.value))
                    }
                  >
                    <option value="">Select item</option>
                    {itemsList.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min={1}
                    className="w-full p-1 border rounded"
                    value={item.qty}
                    onChange={(e) =>
                      setItems(
                        items.map((it, i) =>
                          i === idx ? { ...it, qty: Number(e.target.value) } : it
                        )
                      )
                    }
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    min={0}
                    className="w-full p-1 border rounded"
                    value={item.rate}
                    onChange={(e) =>
                      setItems(
                        items.map((it, i) =>
                          i === idx ? { ...it, rate: Number(e.target.value) } : it
                        )
                      )
                    }
                  />
                </td>
                <td className="p-2 text-right">
                  {(item.qty * item.rate).toFixed(2)}
                </td>
                <td className="p-2 text-center">
                  <button onClick={() => removeItem(idx)}>
                    <X size={16} className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          onClick={addItem}
          className="px-4 py-2 mt-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          + Add Item
        </button>
      </div>
      </div>

      {/* Totals */}
      <div className="p-4 mb-6 space-y-2 rounded-lg bg-green-100">
        <div className="flex justify-between">
          <span>Sub Total</span>
          <span>{subTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">GST ({taxRate}%)</span>
          <span className="text-sm">₹{taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total (₹)</span>
          <span>{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/books/sales/challans")}
          className="px-6 py-2 bg-gray-200 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => saveChallan("draft")}
          className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={downloadChallan}
          className="px-6 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
