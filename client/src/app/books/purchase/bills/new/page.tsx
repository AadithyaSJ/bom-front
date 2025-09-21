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

  // Form state
  const [selectedVendorId, setSelectedVendorId] = useState<number | "">("");
  const [billNumber, setBillNumber] = useState("B-" + (Math.floor(Date.now() / 1000) % 100000));
  const [referenceNumber, setReferenceNumber] = useState("REF-" + (Math.floor(Date.now() / 1000) % 10000000));
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<"PAID" | "UNPAID" | "PARTIAL" | "DRAFT">("DRAFT");
  const [balanceDue, setBalanceDue] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [billItems, setBillItems] = useState<BillItemRow[]>([{ id: crypto.randomUUID(), name: "", qty: 1, rate: 0, taxPct: 0, amount: 0 }]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState("");

  // Load vendors from API
  useEffect(() => {
    async function loadVendors() {
      try {
        const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/vendors/");
        if (!res.ok) throw new Error("Failed to fetch vendors");
        const data = await res.json();
        setVendors(data.results || []);
        setVendorFetchError("");
      } catch {
        setVendorFetchError("Failed to load vendors");
      } finally {
        setLoadingVendors(false);
      }
    }
    loadVendors();
  }, []);

  // Handlers for bill items
  const addRow = () => setBillItems(curr => [...curr, { id: crypto.randomUUID(), name: "", qty: 1, rate: 0, taxPct: 0, amount: 0 }]);
  const removeRow = (id: string) => setBillItems(curr => (curr.length > 1 ? curr.filter(row => row.id !== id) : curr));
  const updateRow = (id: string, patch: Partial<BillItemRow>) =>
    setBillItems(curr => curr.map(row => (row.id === id ? { ...row, ...patch, amount: ((patch.qty ?? row.qty) * (patch.rate ?? row.rate)) * (1 + (patch.taxPct ?? row.taxPct) / 100) } : row)));

  // Totals
  const subTotal = useMemo(() =>
    billItems.reduce((sum, item) => sum + (item.qty * item.rate), 0), [billItems]);
  const taxTotal = useMemo(() =>
    billItems.reduce((sum, item) => sum + ((item.qty * item.rate * item.taxPct) / 100), 0), [billItems]);
  const total = useMemo(() => subTotal + taxTotal, [subTotal, taxTotal]);

  // Update balanceDue based on status and total
  useEffect(() => {
    if (status === "UNPAID") {
      setBalanceDue(total);
    } else if (status === "PAID" || status === "DRAFT") {
      setBalanceDue(0);
    } // For PARTIAL, keep user input of balanceDue
  }, [status, total]);

  // Attachments
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setAttachments(Array.from(e.target.files));
  }

  // Save handler for Bill
  async function saveBill() {
    if (!selectedVendorId) {
      alert("Please select a vendor");
      return;
    }
    // If status is UNPAID, balanceDue is total; if PARTIAL, use user input; else zero
    let finalBalanceDue = 0;
    if (status === "UNPAID") finalBalanceDue = total;
    else if (status === "PARTIAL") finalBalanceDue = balanceDue;
    else finalBalanceDue = 0;

    const payload = {
      vendor_id: selectedVendorId,
      bill_number: billNumber,
      reference_number: referenceNumber,
      bill_date: billDate,
      due_date: dueDate,
      status,
      notes,
      subtotal: subTotal.toFixed(2),
      tax: taxTotal.toFixed(2),
      total_amount: total.toFixed(2),
      balance_due: finalBalanceDue.toFixed(2),
      items: billItems.map(item => ({
        name: item.name,
        quantity: item.qty,
        rate: item.rate,
        tax_percentage: item.taxPct,
        amount: item.amount.toFixed(2),
      })),
      // attachments handling can be added here,
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
            <label className="block font-medium text-green-700 mb-1">Vendor</label>
            {loadingVendors ? (
              <p>Loading vendors...</p>
            ) : vendorFetchError ? (
              <p className="text-red-600">{vendorFetchError}</p>
            ) : (
              <select
                value={selectedVendorId}
                onChange={e => setSelectedVendorId(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border border-green-300 rounded px-3 py-2"
              >
                <option value="">Select vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.display_name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block font-medium text-green-700 mb-1">Bill Number</label>
            <input type="text" value={billNumber} onChange={e => setBillNumber(e.target.value)} className="w-full border border-green-300 rounded px-3 py-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block font-medium text-green-700 mb-1">Reference</label>
            <input type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)} className="w-full border border-green-300 rounded px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-green-700 mb-1">Bill Date</label>
              <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="w-full border border-green-300 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-medium text-green-700 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-green-300 rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block font-medium text-green-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full border border-green-300 rounded px-3 py-2"
            >
              <option value="PAID">PAID</option>
              <option value="UNPAID">UNPAID</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          </div>
        </div>

        {(status === "PARTIAL" || status === "UNPAID") && (
          <div className="mt-6 max-w-xs">
            <label className="block font-medium text-green-700 mb-1">Balance Due</label>
            {status === "PARTIAL" ? (
              <input
                type="number"
                min={0}
                max={total}
                value={balanceDue}
                onChange={e => setBalanceDue(Number(e.target.value))}
                className="w-full border border-green-300 rounded px-3 py-2"
              />
            ) : (
              <input
                type="number"
                value={total}
                disabled
                className="w-full border border-green-300 rounded px-3 py-2 bg-gray-100"
              />
            )}
          </div>
        )}

        {/* Bill items table */}
        <div className="overflow-hidden border rounded-xl mt-6">
          <table className="w-full">
            <thead className="text-green-900 bg-green-100">
              <tr>
                <th className="p-2 text-left">Item</th>
                <th className="p-2 text-left">Qty</th>
                <th className="p-2 text-left">Rate</th>
                <th className="p-2 text-left">Tax %</th>
                <th className="p-2 text-left">Amount</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {billItems.map(item => (
                <tr key={item.id} className="bg-green-50">
                  <td className="p-2">
                    <input className="w-full border border-green-300 rounded px-2 py-1" value={item.name} onChange={e => updateRow(item.id, { name: e.target.value })} placeholder="Item" />
                  </td>
                  <td className="p-2">
                    <input type="number" min={0} value={item.qty} onChange={e => updateRow(item.id, { qty: Number(e.target.value) })} className="w-20 border border-green-300 rounded px-3 py-2" />
                  </td>
                  <td className="p-2">
                    <input type="number" min={0} value={item.rate} onChange={e => updateRow(item.id, { rate: Number(e.target.value) })} className="w-24 border border-green-300 rounded px-3 py-2" />
                  </td>
                  <td className="p-2">
                    <input type="number" min={0} value={item.taxPct} onChange={e => updateRow(item.id, { taxPct: Number(e.target.value) })} className="w-24 border border-green-300 rounded px-3 py-2" />
                  </td>
                  <td className="p-2 text-right font-semibold">{item.amount.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button className="text-red-600 hover:text-red-800" onClick={() => removeRow(item.id)} title="Remove">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Add Item</button>
        </div>

        {/* Totals and attachments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block font-semibold text-green-700 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-green-300 rounded px-3 py-2" placeholder="Notes" />
            <label className="block font-semibold text-green-700 mb-1 mt-4">Attachments</label>
            <input type="file" multiple onChange={handleFileChange} />
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map(f => <span key={f.name} className="bg-green-100 text-green-700 px-2 py-1 rounded">{f.name}</span>)}
            </div>
          </div>
          <div className="p-6 bg-green-50 rounded border border-green-200 space-y-3">
            <div className="flex justify-between">Subtotal <span>₹{subTotal.toFixed(2)}</span></div>
            <div className="flex justify-between">Tax <span>₹{taxTotal.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2 font-semibold text-lg">Total <span>₹{total.toFixed(2)}</span></div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex mt-6 flex-wrap justify-end gap-3">
          <button onClick={saveBill} className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700">Save Bill</button>
          <button onClick={() => router.push("/books/purchase/bills")} className="px-4 py-2 border rounded-lg hover:bg-red-100">Cancel</button>
        </div>
      </div>
    </div>
  );
}
