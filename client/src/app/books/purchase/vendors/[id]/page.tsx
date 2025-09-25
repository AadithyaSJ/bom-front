"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUpload,
  FaInfoCircle,
  FaTrash,
  FaCopy,
  FaPlus,
  FaTag,
} from "react-icons/fa";
import { fetchWithAuth } from "@/auth/tokenservice";

type Vendor = {
  id: number;
  vendor_type: "business" | "individual";
  salutation: "dr" | "mr" | "ms" | "mrs" | "";
  first_name: string;
  last_name: string;
  company_name: string;
  display_name: string;
  email: string;
  work_phone: string;
  mobile: string;
  pan: string;
  currency: string;
  opening_balance: number;
  payment_terms: string;
  documents: { name: string; size: number; type: string }[];
  billing_attention: string;
  billing_country: string;
  billing_street1: string;
  billing_street2: string;
  billing_city: string;
  billing_state: string;
  billing_pin_code: string;
  billing_phone: string;
  billing_fax: string;
  shipping_attention: string;
  shipping_country: string;
  shipping_street1: string;
  shipping_street2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pin_code: string;
  shipping_phone: string;
  shipping_fax: string;
  contact_persons: {
    salutation: "dr" | "mr" | "ms" | "mrs" | "";
    first_name: string;
    last_name: string;
    email: string;
    work_phone: string;
    mobile: string;
  }[];
  custom_fields: Record<string, string>;
  tags: string[];
  remarks: string;
};

type TabKey =
  | "Other Details"
  | "Address"
  | "Contact Persons"
  | "Custom Fields"
  | "Reporting Tags"
  | "Remarks";

const CURRENCIES = [
  "AED - UAE",
  "AUD - Australian Dollar",
  "BND - Brunei",
  "CAD - Canadian Dollar",
  "CNY - Yuan",
  "EUR - Euro",
  "GBP - Pound Sterling",
  "INR - Indian Rupee",
  "JPY - Japanese Yen",
  "SAR - Saudi",
  "USD - US Dollar",
  "ZAR - South African Rand",
];

const PAYMENT_TERMS = [
  "due_receipt",
  "net_7",
  "net_15",
  "net_30",
  "net_45",
];

export default function ViewVendorPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const inputBase =
    "w-full rounded-md border border-green-300 px-3 py-2 focus:outline-none focus:ring-0 bg-gray-50 cursor-not-allowed";
  const withIcon =
    "flex items-center rounded-md border border-green-300 px-3 bg-gray-50 cursor-not-allowed";

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("Other Details");

  useEffect(() => {
    if (!vendorId) return;
    setLoading(true);
    setError("");
    async function fetchVendor() {
      try {
        const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/vendors/${vendorId}/`);
        if (!res.ok) throw new Error("Failed to fetch vendor");
        const data: Vendor = await res.json();
        setVendor(data);
      } catch (e) {
        setError("Failed to load vendor data");
      } finally {
        setLoading(false);
      }
    }
    fetchVendor();
  }, [vendorId]);

  if (loading) return <p>Loading vendor details...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!vendor) return <p>Vendor not found.</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-50 sm:p-8">
      <div className="max-w-6xl p-6 mx-auto bg-white border border-gray-300 rounded-lg shadow">
       <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Vendor Details
          </h1>
          <div className="flex items-center space-x-2">
            <Link
              href={`/books/purchase/vendors/${vendor.id}/edit`}
              className="text-white bg-green-600 hover:bg-green-700 rounded px-4 py-1 font-semibold"
            >
              Edit
            </Link>
            <button
              className="text-green-700 border border-green-700 rounded px-4 py-1"
              onClick={() => router.back()}
            >
              Back
            </button>
          </div>
        </div>

        {/* Vendor Type */}
        <div className="mb-5">
          <label className="block mb-2 font-medium text-gray-700">Vendor Type</label>
          <div className="flex gap-8">
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="radio"
                checked={vendor.vendor_type === "business"}
                disabled
                className="cursor-not-allowed"
              />
              Business
            </label>
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="radio"
                checked={vendor.vendor_type === "individual"}
                disabled
                className="cursor-not-allowed"
              />
              Individual
            </label>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Salutation</label>
            <input
              className={inputBase}
              value={vendor.salutation.toUpperCase()}
              disabled
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">First Name</label>
            <input className={inputBase} value={vendor.first_name} disabled />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Last Name</label>
            <input className={inputBase} value={vendor.last_name} disabled />
          </div>
        </div>

        {/* Company & Display Name */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Company Name</label>
            <input
              className={inputBase}
              value={vendor.company_name}
              disabled
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Display Name</label>
            <input
              className={inputBase}
              value={vendor.display_name}
              disabled
            />
          </div>
        </div>

        {/* Email & Phones */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Email</label>
            <input className={inputBase} value={vendor.email} disabled />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Work Phone</label>
            <input className={inputBase} value={vendor.work_phone} disabled />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Mobile</label>
            <input className={inputBase} value={vendor.mobile} disabled />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          {["Other Details", "Address", "Contact Persons", "Custom Fields", "Reporting Tags", "Remarks"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as TabKey)}
              className={`mr-6 pb-2 text-sm font-medium ${
                activeTab === tab ? "border-b-2 border-indigo-600 text-indigo-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === "Other Details" && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Tax ID</label>
              <input className={inputBase} value={vendor.pan} disabled />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Currency</label>
              <input className={inputBase} value={vendor.currency} disabled />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Opening Balance</label>
              <input className={inputBase} value={vendor.opening_balance} disabled />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Payment Terms</label>
              <input className={inputBase} value={vendor.payment_terms} disabled />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Documents</label>
              {!vendor.documents || vendor.documents.length === 0 ? (
                <p className="text-gray-500 italic">No documents uploaded.</p>
              ) : (
                <ul className="list-disc pl-5 text-gray-700">
                  {vendor.documents.map((doc, i) => (
                    <li key={i}>
                      {doc.name} ({Math.round(doc.size / 1024)} KB)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === "Address" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Billing Address</h3>
              {[
                ["Attention", vendor.billing_attention],
                ["Country", vendor.billing_country],
                ["Street 1", vendor.billing_street1],
                ["Street 2", vendor.billing_street2],
                ["City", vendor.billing_city],
                ["State", vendor.billing_state],
                ["Pin Code", vendor.billing_pin_code],
                ["Phone", vendor.billing_phone],
                ["Fax", vendor.billing_fax],
              ].map(([label, value], i) => (
                <div key={i} className="mb-3">
                  <label className="block text-gray-700 font-medium">{label}</label>
                  <input className={inputBase} value={value as string} disabled />
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Shipping Address</h3>
              {[
                ["Attention", vendor.shipping_attention],
                ["Country", vendor.shipping_country],
                ["Street 1", vendor.shipping_street1],
                ["Street 2", vendor.shipping_street2],
                ["City", vendor.shipping_city],
                ["State", vendor.shipping_state],
                ["Pin Code", vendor.shipping_pin_code],
                ["Phone", vendor.shipping_phone],
                ["Fax", vendor.shipping_fax],
              ].map(([label, value], i) => (
                <div key={i} className="mb-3">
                  <label className="block text-gray-700 font-medium">{label}</label>
                  <input className={inputBase} value={value as string} disabled />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Contact Persons" && (
          <div className="mb-6">
            {vendor.contact_persons.length === 0 ? (
              <p className="text-gray-500 italic">No contact persons added.</p>
            ) : (
              <table className="w-full text-sm text-gray-700 border border-gray-300 rounded">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="p-2 text-left">Salutation</th>
                    <th className="p-2 text-left">First Name</th>
                    <th className="p-2 text-left">Last Name</th>
                    <th className="p-2 text-left">Email</th>
                    <th className="p-2 text-left">Work Phone</th>
                    <th className="p-2 text-left">Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {vendor.contact_persons.map((cp, i) => (
                    <tr key={i} className="border-b border-gray-300">
                      <td className="p-2">{cp.salutation.toUpperCase()}</td>
                      <td className="p-2">{cp.first_name}</td>
                      <td className="p-2">{cp.last_name}</td>
                      <td className="p-2">{cp.email}</td>
                      <td className="p-2">{cp.work_phone}</td>
                      <td className="p-2">{cp.mobile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "Custom Fields" && (
          <div className="mb-6">
            {Object.keys(vendor.custom_fields).length === 0 ? (
              <p className="text-gray-500 italic">No custom fields added.</p>
            ) : (
              <table className="w-full text-gray-700 border border-gray-300 rounded">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="p-2 text-left">Field</th>
                    <th className="p-2 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(vendor.custom_fields).map(([key, value], i) => (
                    <tr key={i} className="border-b border-gray-300">
                      <td className="p-2">{key}</td>
                      <td className="p-2">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "Reporting Tags" && (
          <div className="mb-6">
            {vendor.tags.length === 0 ? (
              <p className="text-gray-500 italic">No tags added.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {vendor.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Remarks" && (
          <div className="mb-6">
            <label className="block mb-1 font-medium text-gray-700">Remarks</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 bg-gray-50"
              rows={5}
              value={vendor.remarks}
              disabled
            />
          </div>
        )}

        <div className="flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-200">
          <button
            className="px-6 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}