"use client";

import { useEffect, useState } from "react";
import {
  ChevronDownIcon,
  FunnelIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { fetchWithAuth } from "@/auth/tokenservice";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Link from "next/link";

interface Vendor {
  id: number;
  name: string;
  display_name: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  tax_number?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  state?: string | null;
  country?: string | null;
  zip_code?: string | null;
  contact_person?: string | null;
  active: boolean;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

interface BreakdownEntry {
  id?: number | string;
  account_name?: string;
  account_code?: string;
  invoice_number?: string;
  bill_number?: string;
  date?: string; // ISO date string
  amount?: number;
  tax_amount?: number;
  total_with_tax?: number;
  payment_amount?: number;
  description?: string;
  // ... add other relevant known fields here as per your backend schema
}

type Customer = {
  id: string | number;
  first_name: string;
  last_name: string;
  // Add other fields if known
};


// Types - as before
type ReportDetails = {
  operating_income: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  operating_expense: number;
  operating_profit: number;
  non_operating_income: number;
  non_operating_expense: number;
  net_profit_loss: number;
  payments_received: number;
  invoice_breakdown?: BreakdownEntry[];
  bill_breakdown?: BreakdownEntry[];
};

type ProfitLossReport = {
  period: string;
  basis: string;
  start_date: string;
  end_date: string;
  report: ReportDetails;
  compare_with?: string;
  compare_report?: ReportDetails;
};

export default function ProfitLossPage() {
  const [dateRange, setDateRange] = useState("This Month");
  const [reportBasis, setReportBasis] = useState("Accrual");
  const [compareWith, setCompareWith] = useState("None");
  const [showZeroBalance, setShowZeroBalance] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const [runFilter, setRunFilter] = useState({
    time: "This Month",
    basis: "Accrual",
    compare: "None",
  });

  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError("");
      setReport(null);
      try {
        const token = localStorage.getItem("access_token") ?? "";
        const params = new URLSearchParams();
        params.set("time", runFilter.time);
        params.set("basis", runFilter.basis);
        if (runFilter.compare !== "None") {
          params.set("compare_with", runFilter.compare);
        }
        if (selectedCustomer) params.set("customer_id", selectedCustomer);
        if (selectedVendor) params.set("vendor_id", selectedVendor);

        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/reports/profit-and-loss/?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          let errMsg = "Failed to fetch report";
          try {
            const errBody = await res.json();
            if (errBody?.detail) errMsg = errBody.detail;
          } catch {}
          throw new Error(errMsg);
        }

        const data: ProfitLossReport = await res.json();
        setReport(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [runFilter]);

  useEffect(() => {
  async function fetchDropdownData() {
    const token = localStorage.getItem("access_token") ?? "";

    // Fetch customers
  const resCustomers = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/customers/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resCustomers.ok) {
      const data = await resCustomers.json();
      setCustomers(data.results || []);
    }

    // Fetch vendors
  const resVendors = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/vendors/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resVendors.ok) {
      const data = await resVendors.json();
      setVendors(data.results || []);
    }
  }
  fetchDropdownData();
}, []);


  // Prepare rows for main report
  const mainRows = report
    ? [
        { label: "Operating Income", total: report.report.operating_income },
        { label: "Cost of Goods Sold", total: report.report.cost_of_goods_sold },
        { label: "Gross Profit", total: report.report.gross_profit },
        { label: "Operating Expense", total: report.report.operating_expense },
        { label: "Operating Profit", total: report.report.operating_profit },
        { label: "Non Operating Income", total: report.report.non_operating_income },
        { label: "Non Operating Expense", total: report.report.non_operating_expense },
        { label: "Net Profit/Loss", total: report.report.net_profit_loss },
      ]
    : [];

  // Prepare rows for compare report if exists
  const compareRows =
    report?.compare_report != null
      ? [
          { label: "Operating Income", total: report.compare_report.operating_income },
          { label: "Cost of Goods Sold", total: report.compare_report.cost_of_goods_sold },
          { label: "Gross Profit", total: report.compare_report.gross_profit },
          { label: "Operating Expense", total: report.compare_report.operating_expense },
          { label: "Operating Profit", total: report.compare_report.operating_profit },
          { label: "Non Operating Income", total: report.compare_report.non_operating_income },
          { label: "Non Operating Expense", total: report.compare_report.non_operating_expense },
          { label: "Net Profit/Loss", total: report.compare_report.net_profit_loss },
        ]
      : [];

  const handleRunReport = () => {
    setRunFilter({
      time: dateRange,
      basis: reportBasis,
      compare: compareWith,
    });
  };

  const handleReset = () => {
    setDateRange("This Month");
    setReportBasis("Accrual");
    setCompareWith("None");
    setShowZeroBalance(true);
    setRunFilter({
      time: "This Month",
      basis: "Accrual",
      compare: "None",
    });
  };

  const handleExport = () => {
    if (!report) {
      alert("No data to export");
      return;
    }
    const wb = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(
      mainRows.map(({ label, total }) => ({ Account: label, Total: total }))
    );
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    if (report.report.invoice_breakdown && report.report.invoice_breakdown.length > 0) {
      const invSheet = XLSX.utils.json_to_sheet(report.report.invoice_breakdown);
      XLSX.utils.book_append_sheet(wb, invSheet, "Invoice Breakdown");
    }
    if (report.report.bill_breakdown && report.report.bill_breakdown.length > 0) {
      const billSheet = XLSX.utils.json_to_sheet(report.report.bill_breakdown);
      XLSX.utils.book_append_sheet(wb, billSheet, "Bill Breakdown");
    }

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "profit_and_loss_report.xlsx");
  };

  const handleShare = async () => {
    if (!report) {
      alert("No data to share");
      return;
    }
    const recipient = window.prompt("Enter recipient email address to share the report:");
    if (!recipient) {
      alert("Email is required");
      return;
    }

    try {
      const token = localStorage.getItem("access_token") ?? "";
      const reportData = {
        Account: mainRows.map(({ label, total }) => ({
          Account: label,
          Total: total,
        })),
        invoice_breakdown: report.report.invoice_breakdown ?? [],
        bill_breakdown: report.report.bill_breakdown ?? [],
        start_date: report.start_date,
        end_date: report.end_date,
        basis: report.basis,
      };
      const res = await fetchWithAuth(
  "https://web-production-6baf3.up.railway.app/api/api/send-report-email/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipient_email: recipient,
            subject: "Profit and Loss Report",
            report_data: reportData,
          }),
        }
      );
      if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.error || "Failed to send email");
      }
      alert("Report shared successfully via email.");
    } catch (e) {
      alert(`Failed to share report: ${e instanceof Error ? e.message : e}`);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center">
        <Link href="/books/reports" className="text-gray-600 hover:underline">
          Business Overview
        </Link>
        <span className="mx-2 text-gray-400 font-bold">{">"}</span>
        <span className="text-gray-600">Profit and Loss</span>
        {report && (
          <span className="ml-2 text-gray-500">
            • From {report.start_date} To {report.end_date}
          </span>
        )}
      </div>
      <h1 className="text-3xl font-bold mt-2">Profit and Loss</h1>
      <div className="text-gray-600 mb-4">Basis: {reportBasis}</div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border px-3 py-1 rounded"
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
          </select>
          <select
            value={reportBasis}
            onChange={(e) => setReportBasis(e.target.value)}
            className="border px-3 py-1 rounded"
          >
            <option>Accrual</option>
            <option>Cash</option>
          </select>
          <select
          value={selectedCustomer ?? ""}
          onChange={(e) => setSelectedCustomer(e.target.value || null)}
          className="border px-3 py-1 rounded"
          >
          <option value="">--Select Customers--</option>
          {customers.map((c) => (
          <option key={c.id} value={c.id}>
          {c.first_name} {c.last_name}
          </option>
          ))}
        </select>
        <select
      value={selectedVendor ?? ""}
      onChange={(e) => setSelectedVendor(e.target.value || null)}
      className="border px-3 py-1 rounded"
      >
    <option value="">--Select Vendors--</option>
    {vendors.map((v) => (
    <option key={v.id} value={v.id}>
      {v.first_name} {v.last_name}
    </option>
    ))}
      </select>
          <select
            value={compareWith}
            onChange={(e) => setCompareWith(e.target.value)}
            className="border px-3 py-1 rounded"
          >
            <option>None</option>
            <option>Last Month</option>
            <option>Last Year</option>
          </select>
          <button
            onClick={() => setShowZeroBalance(!showZeroBalance)}
            className="border px-3 py-1 rounded flex items-center gap-1"
          >
            {showZeroBalance ? "Hide" : "Show"} Zero Balance
            <FunnelIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunReport}
            className="bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1"
          >
            Run Report <ChevronDownIcon className="w-7 h-3" />
          </button>
          <button
            onClick={handleExport}
            className="border px-3 py-1 rounded bg-green-100 flex items-center gap-1"
          >
            Export <ArrowUpTrayIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleShare}
            className="border px-3 py-1 rounded flex items-center gap-1"
          >
            Share <ArrowUpTrayIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="border px-3 py-1 rounded flex items-center gap-1 text-red-500"
          >
            Reset <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Table and Comparison */}
      <div className="bg-white shadow rounded-lg overflow-auto">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : (
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 border-b">ACCOUNT</th>
                <th className="text-right px-4 py-2 border-b">TOTAL</th>
                {report && report.compare_with && report.compare_report && (
                  <th className="text-right px-4 py-2 border-b">
                    Compare With: {report.compare_with}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {mainRows.map(({ label, total }, idx) => {
                const compTotal = compareRows[idx]?.total ?? null;

                // Filter zero balances if needed
                if (
                  !showZeroBalance &&
                  (total === 0 || total === null) &&
                  (compTotal === 0 || compTotal === null)
                ) {
                  return null;
                }

                return (
                  <tr key={label} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{label}</td>
                    <td className="px-4 py-2 text-right">
                      {total?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ??
                        "0.00"}
                    </td>
                    {report && report.compare_with && report.compare_report && (
                      <td className="px-4 py-2 text-right">
                        {compTotal?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ??
                          "0.00"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
