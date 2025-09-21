"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import Link from "next/link";

export interface Bill {
  id: string;

  bill_date?: string;
  bill_number?: string;
  due_date?: string;
  reference_number?: string;

  total_amount?: string;
  subtotal?: number;
  tax?: number;
  balance_due?: string;

  status?: string;
  notes?: string;

  vendor?: any;
  vendorSnapshot?: any;

  meta?: {
    itemsExtended?: any[];
    files?: any[];
  };

  items?: any[];

  [key: string]: any;
}

export default function BillEditPage() {
  const params = useParams();
  const billId = params?.id ?? null;
  const router = useRouter();

  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    if (!billId) return;
    setLoading(true);
    setBill(null);

    async function loadBill() {
      try {
        const res = await fetchWithAuth(`https://bom-front-production.up.railway.app/api/bills/${billId}/`);
        if (res.ok) {
          const data = await res.json();
          setBill(data);
        }
      } finally {
        setLoading(false);
      }
    }
    loadBill();
  }, [billId]);

  function getVendorDisplay(vendor: any, vendorSnapshot: any): string {
    if (!vendor && !vendorSnapshot) return "-";
    if (typeof vendor === "string") return vendorSnapshot?.name ?? "-";
    if (vendor && typeof vendor === "object") {
      return (
        vendor.name ??
        [vendor.display_name].filter(Boolean).join(" ").trim() ??
        vendorSnapshot?.name ??
        "-"
      );
    }
    if (vendorSnapshot && vendorSnapshot.name) return vendorSnapshot.name;
    return "-";
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!bill) return <div className="p-6">Bill not found.</div>;

  const subtotal = parseFloat(bill.subtotal as any) || 0;
const tax = parseFloat(bill.tax as any) || 0;
const total = parseFloat(
  bill.total_amount ??
  "0"
);
const balanceDue = parseFloat(
  bill.balance_due ??
  "0"
);


  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-xl shadow">
      <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Bill Details (View only)
          </h1>
          <div className="flex items-center space-x-2">
            <Link
              href={`/books/purchase/bills/${bill.id}/edit`}
              className="text-white bg-green-600 hover:bg-green-700 rounded px-4 py-1 font-semibold"
            >
              Edit
            </Link>
            <button
              className="text-green-700 border border-green-700 rounded px-4 py-1"
              onClick={() => router.push('/books/purchase/bills')}
            >
              Back
            </button>
          </div>
        </div>

      {/* Bill Main Info */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div>
          <div className="text-sm text-gray-600">Vendor</div>
          <div className="font-medium">{getVendorDisplay(bill.vendor, bill.vendorSnapshot)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Bill #</div>
          <div className="font-medium">{bill.bill_number ?? bill.billNo ?? bill.billNumber ?? "-"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Status</div>
          <div className="font-medium">{bill.status ?? "-"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Date</div>
          <div className="font-medium">{bill.bill_date ?? bill.billDate ?? bill.date ?? "-"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Due Date</div>
          <div className="font-medium">{bill.dueDate ?? bill.due_date ?? "-"}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Reference #</div>
          <div className="font-medium">{bill.referenceNumber ?? bill.reference_number ?? "-"}</div>
        </div>
      </div>

      {/* Bill Items */}
      <div className="mb-6">
        <div className="font-semibold text-emerald-700 mb-2">Items</div>
        <table className="w-full border rounded-xl overflow-x-auto">
          <thead className="bg-emerald-50">
            <tr className="text-sm text-left text-emerald-800">
              <th className="p-3">Item</th>
              <th className="p-3">Description</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Rate</th>
              <th className="p-3">Tax %</th>
              <th className="p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(bill.meta?.itemsExtended ?? bill.items ?? []).map((item: any, i: number) => {
              const qty = Number(item.qty ?? item.quantity ?? 0);
              const rate = Number(item.rate ?? item.unit_price ?? 0);
              const tax = Number(item.taxPct ?? item.tax_percentage ?? 0);
              const amount = qty * rate * (1 + tax / 100);
              return (
                <tr key={item.id ?? i} className="border-t">
                  <td className="p-2">{item.name ?? item.item_name ?? "-"}</td>
                  <td className="p-2">{item.desc ?? item.description ?? "-"}</td>
                  <td className="p-2">{qty}</td>
                  <td className="p-2">{rate.toFixed(2)}</td>
                  <td className="p-2">{tax}</td>
                  <td className="p-2">₹ {amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals and Notes */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 text-sm text-gray-600">Notes</div>
          <div className="p-3 bg-gray-50 border rounded">
            {bill.notes ?? <span className="text-gray-400 italic">No notes</span>}
          </div>
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl">
  <div className="flex justify-between py-1">
    <span>Subtotal</span>
    <span>₹ {subtotal.toFixed(2)}</span>
  </div>
  <div className="flex justify-between py-1">
    <span>Tax</span>
    <span>₹ {tax.toFixed(2)}</span>
  </div>
  <div className="flex justify-between py-2 mt-2 font-semibold border-t text-emerald-800">
    <span>Total</span>
    <span>₹ {total.toFixed(2)}</span>
  </div>
  <div className="flex justify-between py-1 border-t">
    <span>Balance Due</span>
    <span>₹ {balanceDue.toFixed(2)}</span>
  </div>
</div>
      </div>

      {/* Attachments */}
      <div>
        <div className="mb-1 font-semibold text-emerald-700">Attachments</div>
        {bill.meta?.files?.length ? (
          <ul className="flex flex-wrap gap-2">
            {bill.meta.files.map((f: any, i: number) => (
              <li
                key={f.id ?? i}
                className="bg-gray-100 rounded px-3 py-1 text-sm truncate"
              >
                {f.name}
              </li>
            ))}
          </ul>
        ) : (
          <div className="italic text-gray-500">No attachments</div>
        )}
      </div>
    </div>
  );
}
