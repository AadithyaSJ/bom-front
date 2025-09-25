"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { FaEnvelope, FaPhone, FaUser,FaMobileAlt } from "react-icons/fa";

type ContactPerson = {
  salutation?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
};

type Item = {
  id: number;
  name: string;
  sales_description?: string;
};

type Customer = {
  id: number;
  customer_type: string;
  salutation?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  display_name?: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
  pan?: string;
  currency?: string;
  opening_balance?: string;
  payment_terms?: string;
  billing_attention?: string;
  billing_country?: string;
  billing_street1?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_pin_code?: string;
  billing_phone?: string;
  billing_fax?: string;
  shipping_attention?: string;
  shipping_country?: string;
  shipping_street1?: string;
  shipping_street2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pin_code?: string;
  shipping_phone?: string;
  shipping_fax?: string;
  contact_persons?: ContactPerson[];
  custom_fields?: { [key: string]: string };
  tags?: string[];
  remarks?: string;
  created_at?: string;
};

type InvoiceItemDetail = {
  id: number;
  item: Item;
  quantity: number;
  rate: string;
  amount: string;
  invoice_item_number: number;
};

type Invoice = {
  id: number;
  customer: Customer;
  invoice_number: string;
  order_number: string;
  invoice_date: string;
  due_date: string; // assuming a due_date exists, replace or remove if not
  status:string;
  item_details: InvoiceItemDetail[];
  customer_notes?: string;
  terms_and_conditions?: string;
  total_amount: string;
  attached_files?: { id: number; file: string; uploaded_at: string }[];
  invoice_files?: { id: number; file: string; uploaded_at: string }[];
  created_at: string;
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/invoices/${id}/`
        );
        if (!res.ok) throw new Error("Failed to fetch invoice data");
        const data: Invoice = await res.json();
        setInvoice(data);
      } catch (err) {
        setError("Failed to load invoice data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [id]);

  if (loading) return <p>Loading invoice details...</p>;
  if (error || !invoice)
    return <p className="text-red-600">{error || "Invoice not found"}</p>;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-green-800">
          Invoice: {invoice.invoice_number}
        </h2>
        <button
          className="text-green-700 border border-green-200 rounded px-4 py-1 hover:bg-green-50"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>

      {/* Associated Customer Info */}
      <div className="mb-6">
        <h3 className="font-semibold text-green-700 mb-2">Customer Info</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-green-700">
            <FaUser /> {invoice.customer.display_name || ""}
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <FaEnvelope /> {invoice.customer.email || ""}
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <FaPhone /> {invoice.customer.work_phone || ""}
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <FaMobileAlt /> {invoice.customer.mobile || ""}
          </div>
        </div>
        <div className="text-sm mt-4">
          Company: {invoice.customer.company_name || ""} <br />
          Type: {invoice.customer.customer_type === "business" ? "Business" : "Individual"}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="mt-6">
        <h3 className="font-semibold text-green-700 mb-2">Invoice Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-700">Order Number:</span>{" "}
            <span className="text-gray-900">{invoice.order_number}</span>
          </div>
          <div>
            <span className="text-gray-700">Invoice Date:</span>{" "}
            <span className="text-gray-900">{invoice.invoice_date}</span>
          </div>
          {/* Include Due Date if applicable */}
          <div>
            <span className="text-gray-700">Due Date:</span>{" "}
            <span className="text-gray-900">{invoice.due_date}</span>
          </div>
          <div>
            <span className="text-gray-700">Status:</span>{" "}
            <span className="text-gray-900">{invoice.status}</span>
          </div>
        </div>
      </div>

      {/* Financial Section */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">Amount Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-700">Total Amount:</span>{" "}
            <span className="text-gray-900 font-bold">₹{parseFloat(invoice.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      {invoice.customer_notes && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">Customer Notes</h3>
          <div className="text-gray-800">{invoice.customer_notes}</div>
        </div>
      )}

      {invoice.terms_and_conditions && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">Terms & Conditions</h3>
          <div className="text-gray-800">{invoice.terms_and_conditions}</div>
        </div>
      )}

      {/* Tags */}
      {invoice.customer.tags && invoice.customer.tags.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {invoice.customer.tags.map((tag, idx) => (
              <span key={idx} className="border px-2 py-1 rounded-full text-xs bg-green-50 text-green-800">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Remarks */}
      {invoice.customer.remarks && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">Customer Remarks</h3>
          <div className="text-gray-800">{invoice.customer.remarks}</div>
        </div>
      )}

      {/* Item Details */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">Item Details</h3>
        {invoice.item_details && invoice.item_details.length > 0 ? (
          <table className="w-full table-fixed text-sm mb-3">
            <thead>
              <tr className="text-green-800 bg-green-50">
                <th className="py-1 font-medium">Item Name</th>
                <th className="py-1 font-medium">Description</th>
                <th className="py-1 font-medium">Quantity</th>
                <th className="py-1 font-medium">Rate</th>
                <th className="py-1 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.item_details.map((detail, idx) => (
                <tr key={detail.id} className="border-b">
                  <td className="text-center align-middle">{detail.item?.name || "N/A"}</td>
                  <td className="text-center align-middle">{detail.item?.sales_description || "N/A"}</td>
                  <td className="text-center align-middle">{detail.quantity}</td>
                  <td className="text-center align-middle">₹{parseFloat(detail.rate).toFixed(2)}</td>
                  <td className="text-center align-middle">₹{parseFloat(detail.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <span className="text-gray-500">No item details found.</span>
        )}
      </div>
    </div>
  );
}
