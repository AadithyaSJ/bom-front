"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface InventoryAdjustment {
  item: number | string; // Assuming your API returns the item ID here
  adjustmentnumber: string;
  description?: string;
  status: string;
  referenceNumber?: string;
  type: string;
  createdBy: string;
  createdTime: string;   // ISO datetime string
  lastModifiedBy: string;
  lastModifiedTime: string; // ISO datetime string
  date: string;          // ISO date string e.g. "2025-09-21"
  quantity: number;
  reason?: string;
  notes?: string;
  createdat: string;     // ISO datetime string
}


export default function InventoryAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("adjustments") || "[]");
    setAdjustments(stored);
  }, []);

  return (
    <div className="min-h-screen p-6 bg-green-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-green-900">Inventory Adjustments</h1>
        <Link
          href="/books/items/inventory/new"
          className="px-4 py-2 font-medium text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
        >
          + New
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse rounded-lg shadow">
          <thead>
            <tr className="font-semibold text-green-900 bg-green-200">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reference Number</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Created By</th>
              <th className="px-4 py-3">Created Time</th>
              <th className="px-4 py-3">Last Modified By</th>
              <th className="px-4 py-3">Last Modified Time</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-6 text-center text-green-600"
                >
                  No data to display
                </td>
              </tr>
            ) : (
              adjustments.map((adj, idx) => (
                <tr
                  key={idx}
                  className={`${
                    idx % 2 === 0 ? "bg-green-50" : "bg-green-100"
                  } hover:bg-green-200`}
                >
                  <td className="px-4 py-3">{adj.date}</td>
                  <td className="px-4 py-3">{adj.reason}</td>
                  <td className="px-4 py-3">{adj.description}</td>
                  <td className="px-4 py-3">{adj.status}</td>
                  <td className="px-4 py-3">{adj.referenceNumber}</td>
                  <td className="px-4 py-3">{adj.type}</td>
                  <td className="px-4 py-3">{adj.createdBy}</td>
                  <td className="px-4 py-3">{adj.createdTime}</td>
                  <td className="px-4 py-3">{adj.lastModifiedBy}</td>
                  <td className="px-4 py-3">{adj.lastModifiedTime}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}