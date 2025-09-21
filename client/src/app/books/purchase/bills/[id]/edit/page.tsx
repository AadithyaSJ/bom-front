"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import Link from "next/link";

interface Vendor {
  id: number;
  display_name: string;
}

interface BillItem {
  id: number;
  item: number;
  quantity: number;
  rate: number;
  tax_percentage: number;
  amount: number;
  description?: string;
}

interface FileInfo {
  id: number;
  name: string;
}

interface Bill {
  id: number;
  vendor: Vendor;
  vendor_id: number;
  bill_number: string;
  reference_number?: string;
  status: "PAID" | "UNPAID" | "PARTIAL" | "DRAFT";
  bill_date: string;
  due_date: string;
  notes?: string;
  subtotal: number;
  tax: number;
  total_amount: number;
  balance_due: number;
  items: BillItem[];
  files: FileInfo[];
}

const BILL_STATUSES = ["PAID", "UNPAID", "PARTIAL", "DRAFT"] as const;

export default function BillEditPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params?.id;

  // State variables
  const [bill, setBill] = useState<Bill | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [vendorId, setVendorId] = useState<number | "">("");
  const [billNumber, setBillNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<typeof BILL_STATUSES[number]>("DRAFT");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BillItem[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch vendors
        const vendorsRes = await fetchWithAuth("https://bom-front-production.up.railway.app/api/vendors");
        if (vendorsRes.ok) {
          const vendorsData = await vendorsRes.json();
          setVendors(vendorsData.results || []);
        }

        if (billId) {
          // Fetch bill data
          const billRes = await fetchWithAuth(`https://bom-front-production.up.railway.app/api/bills/${billId}`);
          if (billRes.ok) {
            const data = await billRes.json();

            // Normalize items
            const normalizedItems = (data.items || []).map((item: any) => ({
              id: item.id,
              item: item.item || item.item_id,
              quantity: item.quantity || item.qty,
              rate: parseFloat(item.rate),
              tax_percentage: parseFloat(item.tax_percentage),
              amount: parseFloat(item.amount),
              description: item.description || item.desc || "",
            }));

            setBill({
              id: data.id,
              vendor: data.vendor,
              vendor_id: data.vendor_id || (data.vendor?.id ?? null),
              bill_number: data.bill_number,
              reference_number: data.reference_number || "",
              status: data.status,
              bill_date: data.bill_date,
              due_date: data.due_date,
              notes: data.notes || "",
              subtotal: parseFloat(data.subtotal),
              tax: parseFloat(data.tax),
              total_amount: parseFloat(data.total_amount),
              balance_due: parseFloat(data.balance_due),
              items: normalizedItems,
              files: data.files || [],
            });

            setVendorId(data.vendor_id || "");
            setBillNumber(data.bill_number);
            setReferenceNumber(data.reference_number || "");
            setBillDate(data.bill_date);
            setDueDate(data.due_date);
            setStatus(data.status);
            setNotes(data.notes || "");
            setItems(normalizedItems);
            setFiles(data.files || []);
          }
        }
      } catch (err) {
        console.error("Error loading data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [billId]);

  // Calculate totals
  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const taxTotal = items.reduce((acc, item) => acc + item.quantity * item.rate * (item.tax_percentage / 100), 0);
  const total = subtotal + taxTotal;

  // Save function
  async function saveBill() {
    if (!vendorId) {
      alert("Please select a vendor");
      return;
    }
    if (!billNumber.trim()) {
      alert("Please enter a bill number");
      return;
    }
    if (!billDate) {
      alert("Please select a bill date");
      return;
    }
    if (!dueDate) {
      alert("Please select a due date");
      return;
    }
    if (!items.length) {
      alert("Please add at least one item");
      return;
    }

    // const token = localStorage.getItem("authToken");
    // if (!token) {
    //   alert("Please log in");
    //   return;
    // }

    const payload = {
      vendor_id: vendorId,
      bill_number: billNumber.trim(),
      reference_number: referenceNumber.trim(),
      status,
      bill_date: billDate,
      due_date: dueDate,
      notes,
      subtotal,
      tax: taxTotal,
      total_amount: total,
      items: items.map(item => ({
        item: item.item,
        quantity: item.quantity,
        rate: item.rate,
        tax_percentage: item.tax_percentage,
        description: item.description,
      })),
      file_ids: files.map(file => file.id),
    };

    try {
      const url = billId ? `https://bom-front-production.up.railway.app/api/bills/${billId}` : "https://bom-front-production.up.railway.app/api/bills";
      const method = billId ? "PUT" : "POST";

      const res = await fetchWithAuth(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Failed to save bill: ${JSON.stringify(errorData)}`);
        return;
      }

      alert("Bill saved successfully.");
      router.push("/books/purchase/bills");
    } catch (error) {
      alert("Error saving bill, please try again.");
      console.error(error);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!bill && billId) return <div>Bill not found</div>;

  return (
    <div className="container mx-auto max-w-5xl p-4">
      <h1 className="text-3xl font-bold mb-6">{billId ? "Edit Bill" : "New Bill"}</h1>

      <div className="mb-4">
        <label className="mb-1 block font-semibold">Vendor</label>
        <select className="w-full border p-2 rounded" value={vendorId} onChange={e => setVendorId(Number(e.target.value))}>
          <option value="">Select Vendor</option>
          {vendors.map(vendor => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block font-semibold">Bill Number</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={billNumber}
          onChange={e => setBillNumber(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block font-semibold">Reference Number</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={referenceNumber}
          onChange={e => setReferenceNumber(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block font-semibold">Bill Date</label>
        <input
          type="date"
          className="w-full border p-2 rounded"
          value={billDate}
          onChange={e => setBillDate(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block font-semibold">Due Date</label>
        <input
          type="date"
          className="w-full border p-2 rounded"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="mb-1 block font-semibold">Status</label>
        <select className="w-full border p-2 rounded" value={status} onChange={e => setStatus(e.target.value as typeof BILL_STATUSES[number])}>
          {BILL_STATUSES.map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="mb-1 block font-semibold">Notes</label>
        <textarea className="w-full border p-2 rounded" value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
      </div>

      <div className="mb-4">
        <h2 className="mb-2 text-xl font-semibold">Items</h2>
        <button
          className="mb-4 px-4 py-2 rounded bg-green-600 text-white"
          onClick={() => setItems(prev => [...prev, { id: Date.now(), item: 0, quantity: 1, rate: 0, tax_percentage: 0, amount: 0, description: "" }])}
        >
          Add Item
        </button>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Item ID</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">Quantity</th>
              <th className="border p-2">Rate</th>
              <th className="border p-2">Tax %</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const amount = item.quantity * item.rate * (1 + item.tax_percentage / 100);
              return (
                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border p-2">
                    <input
                      type="number"
                      className="w-full border p-1 rounded"
                      value={item.item}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setItems(oldItems => oldItems.map(i => (i.id === item.id ? { ...i, item: val } : i)));
                      }}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      className="w-full border p-1 rounded"
                      value={item.description}
                      onChange={e => {
                        const val = e.target.value;
                        setItems(oldItems => oldItems.map(i => (i.id === item.id ? { ...i, description: val } : i)));
                      }}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min={0}
                      className="w-full border p-1 rounded"
                      value={item.quantity}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setItems(oldItems => oldItems.map(i => (i.id === item.id ? { ...i, quantity: val } : i)));
                      }}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-full border p-1 rounded"
                      value={item.rate}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setItems(oldItems => oldItems.map(i => (i.id === item.id ? { ...i, rate: val } : i)));
                      }}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-full border p-1 rounded"
                      value={item.tax_percentage}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setItems(oldItems => oldItems.map(i => (i.id === item.id ? { ...i, tax_percentage: val } : i)));
                      }}
                    />
                  </td>
                  <td className="border p-2 font-semibold text-right">₹{amount.toFixed(2)}</td>
                  <td className="border p-2 text-center">
                    <button
                      className="text-red-600 hover:text-red-700"
                      disabled={items.length <= 1}
                      onClick={() => setItems(oldItems => oldItems.filter(i => i.id !== item.id))}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mb-4">
        <h2 className="mb-2 text-xl font-semibold">Attachments</h2>
        {files.length === 0 ? (
          <p>No attachments uploaded.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {files.map(file => (
              <li key={file.id} className="border p-1 rounded">{file.name}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-16" />

      <div className="fixed bottom-0 left-0 w-full bg-white shadow px-4 py-3 flex justify-between items-center">
        <div>
          <p className="font-semibold">Subtotal: ₹{subtotal.toFixed(2)}</p>
          <p className="font-semibold">Tax: ₹{taxTotal.toFixed(2)}</p>
          <p className="text-xl font-bold">Total: ₹{total.toFixed(2)}</p>
        </div>
        <div className="space-x-2">
          <button className="btn btn-secondary" onClick={() => router.back()}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={saveBill}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
