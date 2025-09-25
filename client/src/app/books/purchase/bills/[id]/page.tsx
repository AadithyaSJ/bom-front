"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import Link from "next/link";

// Define types aligned with your backend models
interface Vendor {
  id: number | string;
  display_name: string;
  // other vendor fields if needed
}

interface RawItem {
  id: number | string;
  item?: number | string;
  item_id?: number | string;
  name?: string;
  item_name?: string;
  quantity?: number;
  qty?: number;
  rate?: number;
  tax_percentage?: number;
  taxPct?: number;
  amount?: number;
  description?: string;
  desc?: string;
}


interface BillItem {
  id: number | string;
  item: number | string;
  name?: string;
  quantity: number;
  rate: number;
  tax_percentage: number;
  amount: number;
  description: string;
}

interface FileAttachment {
  id: number | string;
  name: string;
}

interface Bill {
  id: number | string;
  vendor: Vendor | null;
  vendorSnapshot?: Vendor | null;
  vendor_id: number | string;
  bill_number: string;
  reference_number?: string;
  status: string;
  bill_date: string;
  due_date: string;
  notes?: string;
  subtotal: number;
  tax: number;
  total_amount: number;
  balance_due: number;
  items: BillItem[];
  files: FileAttachment[];
}

export default function BillDetails() {
  const router = useRouter();
  const params = useParams();
  const billId = params?.id;

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBill() {
      setLoading(true);
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/bills/${billId}`,
          { method: "GET" }
        );
        if (!res.ok) throw new Error("Failed to fetch bill");
        const data = await res.json();

        // Safely normalize items and ensure array
        const itemsData = Array.isArray(data.items) ? data.items : [];

        const normalizedItems: Bill["items"] = (Array.isArray(data.items) ? data.items : []).map((item: RawItem) => ({
  id: item.id,
  item: item.item ?? item.item_id ?? "",
  name: item.name ?? item.item_name ?? "",
  quantity: item.quantity ?? item.qty ?? 0,
  rate: item.rate ?? 0,
  tax_percentage: item.tax_percentage ?? item.taxPct ?? 0,
  amount: item.amount ?? 0,
  description: item.description ?? item.desc ?? "",
}));

        // Build normalized Bill object
        const normalizedBill: Bill = {
          id: data.id,
          vendor: data.vendor || null,
          vendorSnapshot: data.vendorSnapshot,
          vendor_id: data.vendor_id ?? (data.vendor?.id ?? ""),
          bill_number: data.bill_number ?? "",
          reference_number: data.reference_number ?? "",
          status: data.status ?? "",
          bill_date: data.bill_date ?? "",
          due_date: data.due_date ?? "",
          notes: data.notes ?? "",
          subtotal: Number(data.subtotal ?? 0),
          tax: Number(data.tax ?? 0),
          total_amount: Number(data.total_amount ?? 0),
          balance_due: Number(data.balance_due ?? 0),
          items: normalizedItems,
          files: Array.isArray(data.files) ? data.files : [],
        };

        setBill(normalizedBill);
      } catch (error) {
        console.error("Error loading bill:", error);
      } finally {
        setLoading(false);
      }
    }
    if (billId) {
      fetchBill();
    }
  }, [billId]);

  if (loading) return <p>Loading...</p>;
  if (!bill) return <p>Bill not found</p>;

  const subtotal = bill.subtotal;
  const tax = bill.tax;
  const total = bill.total_amount;
  const balanceDue = bill.balance_due;

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">Bill Details</h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <span className="block text-gray-500 text-sm">Vendor</span>
          <p>{bill.vendor?.display_name ?? bill.vendorSnapshot?.display_name ?? "Unknown"}</p>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Bill Number</span>
          <p>{bill.bill_number}</p>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Status</span>
          <p>{bill.status}</p>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Bill Date</span>
          <p>{bill.bill_date}</p>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Due Date</span>
          <p>{bill.due_date}</p>
        </div>
        <div>
          <span className="block text-gray-500 text-sm">Reference Number</span>
          <p>{bill.reference_number || "-"}</p>
        </div>
      </div>

      <table className="w-full border border-gray-300 rounded shadow mb-6">
        <thead className="bg-gray-50 text-left border-b border-gray-300">
          <tr>
            <th className="p-2 border-r border-gray-300">Item</th>
            <th className="p-2 border-r border-gray-300">Description</th>
            <th className="p-2 border-r border-gray-300">Quantity</th>
            <th className="p-2 border-r border-gray-300">Rate</th>
            <th className="p-2 border-r border-gray-300">Tax %</th>
            <th className="p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="p-2 border-r border-gray-300">{item.name || "-"}</td>
              <td className="p-2 border-r border-gray-300">{item.description}</td>
              <td className="p-2 border-r border-gray-300">{item.quantity}</td>
              <td className="p-2 border-r border-gray-300">₹{item.rate.toFixed(2)}</td>
              <td className="p-2 border-r border-gray-300">{item.tax_percentage}%</td>
              <td className="p-2">₹{item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="max-w-md ml-auto text-right mb-6">
        <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
        <p>Tax: ₹{tax.toFixed(2)}</p>
        <p className="font-semibold">Total: ₹{total.toFixed(2)}</p>
        <p>Balance Due: ₹{balanceDue.toFixed(2)}</p>
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded">{bill.notes || <em>No notes provided</em>}</div>

      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-gray-300 rounded"
          onClick={() => router.back()}
        >
          Back
        </button>
        <Link
          href={`/books/bills/${bill.id}/edit`}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
