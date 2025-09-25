"use client";

import { useState, useEffect } from "react";
import {
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { fetchWithAuth } from "@/auth/tokenservice";
import Link from "next/link";

// Helper to map API response to nested table structure
function mapBalanceSheetResponse(apiData) {
  return [
    {
      account: "Assets",
      total: apiData.assets.total_assets,
      children: [
        {
          account: "Current Assets",
          total: apiData.assets.current_assets.total_current_assets,
          children: [
            { account: "Cash", total: apiData.assets.current_assets.cash },
            { account: "Bank", total: apiData.assets.current_assets.bank },
            { account: "Accounts Receivable", total: apiData.assets.current_assets.accounts_receivable },
            { account: "Other current assets", total: apiData.assets.current_assets.other_current_assets },
            { account: "Total Current Assets", total: apiData.assets.current_assets.total_current_assets },
          ],
        },
        { account: "Other Assets", total: apiData.assets.other_assets },
        { account: "Fixed Assets", total: apiData.assets.fixed_assets },
        { account: "Total Assets", total: apiData.assets.total_assets },
      ],
    },
    {
      account: "Liabilities & Equities",
      total: apiData.liabilities_and_equities.total_liabilities_and_equities,
      children: [
        {
          account: "Liabilities",
          total: apiData.liabilities_and_equities.liabilities.total_liabilities,
          children: [
            { account: "Current Liabilities", total: apiData.liabilities_and_equities.liabilities.current_liabilities },
            { account: "Long Term Liabilities", total: apiData.liabilities_and_equities.liabilities.long_term_liabilities },
            { account: "Other Liabilities", total: apiData.liabilities_and_equities.liabilities.other_liabilities },
            { account: "Total Liabilities", total: apiData.liabilities_and_equities.liabilities.total_liabilities },
          ],
        },
        { account: "Equities", total: apiData.liabilities_and_equities.equities },
        { account: "Total Liabilities & Equities", total: apiData.liabilities_and_equities.total_liabilities_and_equities },
      ],
    },
  ];
}

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState("Today");
  const [reportBasis, setReportBasis] = useState("Accrual");
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [reportItems, setReportItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiData, setApiData] = useState(null);

  // Fetch data whenever filters change
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fix spelling for accrual, if using user-select
    const basisParam =
      reportBasis.toLowerCase() === "accrual" ? "Accrual" : "Cash";
    const url = `https://web-production-6baf3.up.railway.app/api/reports/balance-sheet/?time=${encodeURIComponent(asOfDate)}&basis=${basisParam}`;

    fetchWithAuth(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch balance sheet data");
        return res.json();
      })
      .then((data) => {
        setApiData(data);
        setReportItems(mapBalanceSheetResponse(data));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [asOfDate, reportBasis]);

  const handleReset = () => {
    setAsOfDate("Today");
    setReportBasis("Accrual");
    // Optionally refetch here, but useEffect will handle when state updates
    alert("Filters reset!");
  };

  const handleApplyFilter = () => {
    alert(
      `Applying filter:\nDate Range: ${asOfDate}\nReport Basis: ${reportBasis}`
    );
    // Data refetch happens automatically in useEffect
  };

  const handleExport = () => {
    const flattenItems = (items, parent = "") =>
      items.flatMap((item) => [
        [
          parent ? parent + " > " + item.account : item.account,
          item.total !== undefined ? item.total.toFixed(2) : "",
        ],
        ...(item.children ? flattenItems(item.children, item.account) : []),
      ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [["ACCOUNT", "TOTAL"], ...flattenItems(reportItems)]
        .map((e) => e.join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = "balance_sheet.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderRows = (items, level = 0) =>
    items.flatMap((item) => {
      const rows = [
        <tr key={item.account} className="hover:bg-gray-50">
          <td
            className="px-4 py-2 font-semibold"
            style={{ paddingLeft: `${level * 20 + 12}px` }}
          >
            {item.account}
          </td>
          <td className="px-4 py-2 text-right">
            {item.total !== undefined ? item.total.toFixed(2) : ""}
          </td>
        </tr>,
      ];
      if (item.children) {
        rows.push(...renderRows(item.children, level + 1));
      }
      return rows;
    });

  // Date info for the header
  const headerAsOf =
    apiData && apiData.end_date
      ? `As of ${apiData.end_date.split("-").reverse().join("/")}`
      : "";

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Breadcrumb & Page Title */}
      <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
      <div>
        <Link href="/books/reports" className="text-gray-600 hover:underline">
          Business Overview
        </Link>
        <span className="mx-2 text-gray-400 font-bold">{">"}</span>
        <span>Balance Sheet</span>
        <span className="ml-2 text-gray-500">{headerAsOf}</span>
      </div>
    </div>

      {/* Filters Bar */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex gap-2 items-center">
          <span className="font-semibold text-gray-700">Filters</span>
          <select
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Month</option>
          </select>
          <select
            value={reportBasis}
            onChange={(e) => setReportBasis(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option>Accrual</option>
            <option>Cash</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <FunnelIcon
            onClick={handleApplyFilter}
            className="w-5 h-5 text-gray-600 cursor-pointer"
          />
          <button
            className="border p-2 rounded hover:bg-gray-100"
            onClick={() => window.location.reload()}
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
          </button>
          <button
            className="border p-2 rounded hover:bg-gray-100"
            onClick={handleExport}
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
          </button>
          <button
            className="border p-2 rounded hover:bg-gray-100 text-red-500"
            onClick={handleReset}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
          <button
            className="border px-2 py-1 rounded"
            onClick={() => setShowCustomizeModal(true)}
          >
            Customize Columns
          </button>
        </div>
      </div>

      {/* Main Report Table */}
      <main className="p-4 flex-1 overflow-auto">
        <div className="text-center mb-4">
          <div className="text-lg font-semibold">Test</div>
          <div className="text-2xl font-bold">Balance Sheet</div>
          <div className="text-gray-600">Basis: {reportBasis}</div>
          <div className="text-gray-500">{headerAsOf}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 relative">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 border-b">ACCOUNT</th>
                  <th className="text-right px-4 py-2 border-b">TOTAL</th>
                </tr>
              </thead>
              <tbody>{renderRows(reportItems)}</tbody>
            </table>
          )}

          <div className="mt-2 text-sm text-gray-600 flex justify-between items-center">
            <div>
              Amount is displayed in your base currency{" "}
              <span className="bg-green-100 px-1 rounded">INR</span>
            </div>
          </div>
        </div>
      </main>

      {/* Customize Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded w-96">
            <h2 className="text-lg font-bold mb-2">Customize Columns</h2>
            <p>Here you can select which columns to show/hide.</p>
            <button
              className="mt-4 px-3 py-1 border rounded bg-blue-600 text-white"
              onClick={() => setShowCustomizeModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
