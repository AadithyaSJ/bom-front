"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";

type Vendor = {
  id: number;
  display_name: string;
};

type BillItemRow = {
  id: string;
  name: string;
  qty: number;
  rate: number;
  taxPct: number;
  amount: number;
};

export default function NewBillPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [vendorFetchError, setVendorFetchError] = useState("");

  // Form fields
  const [selectedVendorId, setSelectedVendorId] = useState<number | "">("");
  const [billNumber, setBillNumber] = useState("B-" + (Math.floor(Date.now() / 1000) % 100000));
  const [referenceNumber, setReferenceNumber] = useState("REF-" + (Math.floor(Date.now() / 1000) % 10000000));
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"PAID" | "UNPAID" | "PARTIAL" | "DRAFT">("DRAFT");
  const [balanceDue, setBalanceDue] = useState(0);
  const [notes, setNotes] = useState("");
  const [billItems, setBillItems] = useState<BillItemRow[]>([{ id: crypto.randomUUID(), name: "", qty: 1, rate: 0, taxPct: 0, amount: 0 }]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchVendors() {
      try {
        const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/vendors/");
        if (!res.ok) throw new Error("Failed to fetch vendors");

        const data = await res.json();
        setVendors(data.results ?? []);
        setVendorFetchError("");
      } catch {
        setVendorFetchError("Failed to load vendors");
      } finally {
        setLoadingVendors(false);
      }
    }
    fetchVendors();
  }, []);

  const addRow = () =>
    setBillItems((curr) => [...curr, { id: crypto.randomUUID(), name: "", qty: 1, rate: 0, taxPct: 0, amount: 0 }]);
  const removeRow = (id: string) =>
    setBillItems((curr) => (curr.length > 1 ? curr.filter((row) => row.id !== id) : curr));
  const updateRow = (id: string, patch: Partial<Omit<BillItemRow, "amount">>) =>
    setBillItems((curr) =>
      curr.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, ...patch };
        const qty = patch.qty ?? row.qty;
        const rate = patch.rate ?? row.rate;
        const taxPct = patch.taxPct ?? row.taxPct;
        return { ...updated, amount: qty * rate * (1 + taxPct / 100) };
      })
    );

  const subTotal = useMemo(() => billItems.reduce((s, i) => s + i.qty * i.rate, 0), [billItems]);
  const taxTotal = useMemo(() => billItems.reduce((s, i) => s + i.qty * i.rate * (i.taxPct / 100), 0), [billItems]);
  const total = subTotal + taxTotal;

  useEffect(() => {
    if (status === "UNPAID") setBalanceDue(total);
    else if (status === "PAID" || status === "DRAFT") setBalanceDue(0);
    // else keep user input for PARTIAL
  }, [status, total]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setAttachments(Array.from(e.target.files));
  }

  async function saveBill() {
    if (!selectedVendorId) {
      alert("Please select a vendor");
      return;
    }
    let finalBalanceDue = 0;
    if (status === "UNPAID") finalBalanceDue = total;
    else if (status === "PARTIAL") finalBalanceDue = balanceDue;
    const payload = {
      vendor_id: selectedVendorId,
      bill_number: billNumber,
      referenceNumber,
      bill_date: billDate,
      due_date: dueDate,
      status,
      notes,
      subtotal: subTotal.toFixed(2),
      tax: taxTotal.toFixed(2),
      total: total.toFixed(2),
      balanceDue: finalBalanceDue.toFixed(2),
      items: billItems.map(({ name, qty, rate, taxPct, amount }) => ({
        name,
        qty,
        rate,
        taxPct,
        amount: amount.toFixed(2),
      })),
      // attachments: TODO implement file upload
    };

    try {
      const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/bills/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to save bill: ${JSON.stringify(err)}`);
        return;
      }
      router.push("/books/purchase/bills");
    } catch {
      alert("Error saving bill.");
    }
  }

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <h1 className="text-3xl mb-6 text-green-800 font-semibold">New Bill</h1>
      <div className="bg-white p-6 rounded-xl shadow max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-medium text-green-700">Vendor</label>
            {loadingVendors ? (
              <p>Loading vendors...</p>
            ) : vendorFetchError ? (
              <p className="text-red-600">{vendorFetchError}</p>
            ) : (
              <select
                className="w-full border border-green-300 rounded px-3 py-2"
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">Select vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.display_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block mb-2 font-medium text-green-700">Bill Number</label>
            <input
              className="w-full border border-green-300 rounded px-3 py-2"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block mb-2 font-medium text-green-700">Reference Number</label>
            <input
              className="w-full border border-green-300 rounded px-3 py-2"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 font-medium text-green-700">Bill Date</label>
              <input
                type="date"
                className="w-full border border-green-300 rounded px-3 py-2"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-green-700">Due Date</label>
              <input
                type="date"
                className="w-full border border-green-300 rounded px-3 py-2"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 font-medium text-green-700">Status</label>
            <select
              className="w-full border border-green-300 rounded px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value as "PAID" | "UNPAID" | "PARTIAL" | "DRAFT")}
            >
              {["PAID", "UNPAID", "PARTIAL", "DRAFT"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(status === "PARTIAL" || status === "UNPAID") && (
          <div className="mt-6 max-w-xs">
            <label className="block mb-2 font-medium text-green-700">Balance Due</label>
            {status === "PARTIAL" ? (
              <input
                type="number"
                min={0}
                max={total}
                className="w-full border border-green-300 rounded px-3 py-2"
                value={balanceDue}
                onChange={(e) => setBalanceDue(Number(e.target.value))}
              />
            ) : (
              <input
                type="number"
                className="w-full border border-green-300 rounded px-3 py-2 bg-gray-100"
                value={total}
                disabled
              />
            )}
          </div>
        )}

        {/* bill items table */}
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full border-collapse border border-gray-300 rounded">
            <thead className="bg-green-50 text-green-700">
              <tr>
                <th className="border border-green-300 p-2 text-left">Item</th>
                <th className="border border-green-300 p-2 text-left">Qty</th>
                <th className="border border-green-300 p-2 text-left">Rate</th>
                <th className="border border-green-300 p-2 text-left">Tax %</th>
                <th className="border border-green-300 p-2 text-left">Amount</th>
                <th className="border border-green-300 p-2"></th>
              </tr>
            </thead>
            <tbody>
              {billItems.map(({ id, name, qty, rate, taxPct, amount }) => (
                <tr key={id} className="bg-green-50">
                  <td className="border border-green-300 p-2">
                    <input
                      className="w-full border-none bg-transparent"
                      value={name}
                      placeholder="Item"
                      onChange={(e) => updateRow(id, { name: e.target.value })}
                    />
                  </td>
                  <td className="border border-green-300 p-2">
                    <input
                      type="number"
                      className="w-16 border-none bg-transparent"
                      value={qty}
                      min={0}
                      onChange={(e) => updateRow(id, { qty: Number(e.target.value) })}
                    />
                  </td>
                  <td className="border border-green-300 p-2">
                    <input
                      type="number"
                      className="w-24 border-none bg-transparent"
                      value={rate}
                      min={0}
                      onChange={(e) => updateRow(id, { rate: Number(e.target.value) })}
                    />
                  </td>
                  <td className="border border-green-300 p-2">
                    <input
                      type="number"
                      className="w-24 border-none bg-transparent"
                      value={taxPct}
                      min={0}
                      onChange={(e) => updateRow(id, { taxPct: Number(e.target.value) })}
                    />
                  </td>
                  <td className="border border-green-300 p-2 text-right font-semibold">{amount.toFixed(2)}</td>
                  <td className="border border-green-300 p-2 text-right">
                    <button
                      aria-label="Remove Row"
                      disabled={billItems.length === 1}
                      onClick={() => removeRow(id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addRow} className="mt-3 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">
            + Add Item
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div>
            <label className="block mb-2 font-medium text-green-700">Notes</label>
            <textarea
              className="w-full border border-green-300 rounded px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              rows={4}
            />
          </div>
          <div className="bg-green-50 border border-green-300 rounded p-4 space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹ {subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>₹ {taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-green-300 pt-2 font-semibold">
              <span>Total</span>
              <span>₹ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-end">
          <button
            className="px-4 py-2 rounded border hover:bg-red-100"
            onClick={() => router.push("/books/purchase/bills")}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            onClick={saveBill}
          >
            Save Bill
          </button>
        </div>
      </div>
    </div>
  );
}
