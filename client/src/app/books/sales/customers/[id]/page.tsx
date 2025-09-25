"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { FaEnvelope, FaPhone, FaUser,FaIdCard ,FaMobileAlt} from "react-icons/fa";
import Link from "next/link";

type ContactPerson = {
  salutation?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
};


type CustomerDetails = {
  id: number;
  salutation:string,
  display_name: string;
  email: string;
  customer_type: string;
  company_name: string;
  work_phone:string,
  mobile:string,
  pan:string,
  currency: string;
  payment_terms: string;
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
  tags?: string[];
  custom_fields?: { [key: string]: string };
  remarks?: string;
  portal_status?: string;
  portal_language?: string;
  tax_preference?: string;
};

type Invoice = {
  id: number;
  invoice_number: string;
  invoice_date: string;
  total_amount: string;
  status: string;
};

type Quote = {
  id :number;
  quote_number: string,
  total_amount:string,
  quote_date:string,
  status:string
}
type Proforma = {
  id: number;
  invoice_number: string;
  invoice_date: string;
  total_amount: string;
  status: string;
}

type challans = {
  id: number;
  challan_number: string;
  date: string;
  total_amount: string;
  status: string;
}
type DocumentData<T> = {
  count: number;
  results: T[];
};


type Item = {
  id: number;
  name: string;
  sales_description?: string;
};

type Challan = {
  id: number;
  challan_number: string;
  date: string;
  total_amount: string;
  status: string;
};


export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [challans, setChallans] = useState<challans[]>([]);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/customers/${id}/`
        );
        if (!res.ok) throw new Error("Failed to fetch customer data");
        const data = await res.json();
        setCustomer(data);

        const resInvoices = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/invoices/?customer_id=${id}`);
if (resInvoices.ok) {
  const data: DocumentData<Invoice> = await resInvoices.json();
  setInvoices(data.results);
}

const resQuotes = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/quotes/?customer_id=${id}`);
if (resQuotes.ok) {
  const data: DocumentData<Quote> = await resQuotes.json();
  setQuotes(data.results);
}

const resProformas = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/proformainvoices/?customer_id=${id}`);
if (resProformas.ok) {
  const data: DocumentData<Proforma> = await resProformas.json();
  setProformas(data.results);
}

const resChallans = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/deliverychallans/?customer_id=${id}`);
if (resChallans.ok) {
  const data: DocumentData<Challan> = await resChallans.json();
  setChallans(data.results);
}

      } catch (err) {
        setError("Failed to load customer data");
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id]);

  if (loading) return <p>Loading customer details...</p>;
  if (error || !customer)
    return <p className="text-red-600">{error || "Customer not found"}</p>;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-green-800">
            {[
          customer.salutation.charAt(0).toUpperCase() + customer.salutation.slice(1),
          customer.display_name
          ].join(" ")}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
        <Link
          href={`/books/sales/customers/${customer.id}/edit`}
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
      {/* Contact Info (icon row) */}
      <div className="flex gap-6 mb-6">
        <div className="flex items-center gap-2 text-green-700">
          <FaUser /> {customer.display_name}
        </div>
        <div className="flex items-center gap-2 text-green-700">
          <FaEnvelope /> {customer.email}
        </div>
        <div className="flex items-center gap-2 text-green-700">
          <FaPhone /> Work-phone: {customer.work_phone}
        </div>
        <div className="flex items-center gap-2 text-green-700">
          <FaMobileAlt /> Mobile: {customer.mobile}
        </div>
      </div>
      <div className="flex items-center gap-2 text-green-700">
          <FaIdCard /> Pan: {customer.pan}
        </div>
      {/* "Address" section */}
      <div className="mt-6">
        <h3 className="font-semibold text-green-700 mb-1">ADDRESS</h3>
        <div className="flex flex-col md:flex-row gap-8 text-sm">
          <div>
            <div className="font-medium text-green-800 mb-1">Billing Address</div>
            <div className="text-gray-800 whitespace-pre-line min-h-[44px]">
              {customer.billing_street1 || ""}
              {customer.billing_street2 ? `\n${customer.billing_street2}` : ""}
              {customer.billing_city ? `\n${customer.billing_city}` : ""}
              {customer.billing_state ? `, ${customer.billing_state}` : ""}
              {customer.billing_pin_code ? `, ${customer.billing_pin_code}` : ""}
              {customer.billing_phone ? `\nPhone: ${customer.billing_phone}` : ""}
              {customer.billing_fax ? `\nFax: ${customer.billing_fax}` : ""}
            </div>
            {!customer.billing_street1 &&
              <span className="text-gray-500">No Billing Address - Add new address</span>
            }
          </div>
          <div>
            <div className="font-medium text-green-800 mb-1">Shipping Address</div>
            <div className="text-gray-800 whitespace-pre-line min-h-[44px]">
              {customer.shipping_street1 || ""}
              {customer.shipping_street2 ? `\n${customer.shipping_street2}` : ""}
              {customer.shipping_city ? `\n${customer.shipping_city}` : ""}
              {customer.shipping_state ? `, ${customer.shipping_state}` : ""}
              {customer.shipping_pin_code ? `, ${customer.shipping_pin_code}` : ""}
              {customer.shipping_phone ? `\nPhone: ${customer.shipping_phone}` : ""}
              {customer.shipping_fax ? `\nFax: ${customer.shipping_fax}` : ""}
            </div>
            {!customer.shipping_street1 && (
              <span className="text-gray-500">No Shipping Address - Add new address</span>
            )}
          </div>
        </div>
      </div>

      {/* Other Details section */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">OTHER DETAILS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-700">Customer Type:</span>{" "}
            <span className="text-gray-900">{customer.customer_type === "business" ? "Business" : "Individual"}</span>
          </div>
          <div>
            <span className="text-gray-700">Default Currency:</span>{" "}
            <span className="text-gray-900">{customer.currency || "INR"}</span>
          </div>
          <div>
            <span className="text-gray-700">Payment Terms:</span>{" "}
            <span className="text-gray-900">{customer.payment_terms}</span>
          </div>
          {/* Add more fields as needed per your backend data */}
          {customer.portal_status && (
            <div>
              <span className="text-gray-700">Portal Status:</span>{" "}
              <span className="text-gray-900">{customer.portal_status}</span>
            </div>
          )}
          {customer.portal_language && (
            <div>
              <span className="text-gray-700">Portal Language:</span>{" "}
              <span className="text-gray-900">{customer.portal_language}</span>
            </div>
          )}
          {customer.tax_preference && (
            <div>
              <span className="text-gray-700">Tax Preference:</span>{" "}
              <span className="text-gray-900">{customer.tax_preference}</span>
            </div>
          )}
        </div>
      </div>

      {/* Contact Persons */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">CONTACT PERSONS</h3>
        {customer.contact_persons && customer.contact_persons.length > 0 ? (
          <table className="w-full text-sm mb-3 border border-green-200 rounded-lg">
            <thead className="bg-green-50">
              <tr className="text-green-800 bg-green-50">
                <th className="py-1 font-medium">Name</th>
                <th className="py-1 font-medium">Email</th>
                <th className="py-1 font-medium">Work Phone</th>
                <th className="py-1 font-medium">Mobile</th>
              </tr>
            </thead>
            <tbody>
              {customer.contact_persons.map((cp, idx) => (
                <tr key={idx} className="border-b border-green-200">
                  <td className="py-2 px-4 text-center font-medium">{[cp.salutation, cp.first_name, cp.last_name].filter(Boolean).join(" ")}</td>
                  <td className="py-2 px-4 text-center font-medium">{cp.email}</td>
                  <td className="py-2 px-4 text-center font-medium">{cp.work_phone}</td>
                  <td className="py-2 px-4 text-center font-medium">{cp.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <span className="text-gray-500">No contact persons found.</span>
        )}
      </div>

      {customer.custom_fields && Object.keys(customer.custom_fields).length > 0 && (
  <div className="mt-8">
    <h3 className="font-semibold text-lg mb-2">Custom Fields</h3>
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th className="border-b p-2 text-left">Key</th>
          <th className="border-b p-2 text-left">Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(customer.custom_fields).map(([key, value], idx) => (
          <tr key={idx}>
            <td className="border-b p-2">{key}</td>
            <td className="border-b p-2">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

      {/* Tags or associate tag */}
      {customer.tags && customer.tags.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">ASSOCIATE TAGS</h3>
          <div className="flex flex-wrap gap-2">
            {customer.tags.map((tag, idx) => (
              <span
                key={idx}
                className="border px-2 py-1 rounded-full text-xs bg-green-50 text-green-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Remarks */}
      {customer.remarks && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">REMARKS</h3>
          <div className="text-gray-800">{customer.remarks}</div>
        </div>
      )}
       {/* Invoices Section */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">INVOICES</h3>
        {invoices.length > 0 ? (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-green-50 text-green-800">
                <th className="py-1 ">Invoice #</th>
                <th className="py-1">Date</th>
                <th className="py-1">Amount</th>
                <th className="py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b">
                  <td className="py-2 px-4 text-center">{inv.invoice_number}</td>
                  <td className="py-2 px-4 text-center">{inv.invoice_date}</td>
                  <td className="py-2 px-4 text-center">{inv.total_amount}</td>
                  <td className="py-2 px-4 text-center">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <span className="text-gray-500">No invoices found.</span>
        )}
      </div>

      
      {/* Quotes Section */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">QUOTES</h3>
        {quotes.length > 0 ? (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-green-50 text-green-800">
                <th className="py-1 ">Quote No</th>
                <th className="py-1">Date</th>
                <th className="py-1">Amount</th>
                <th className="py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((inv) => (
                <tr key={inv.id} className="border-b">
                  <td className="py-2 px-4 text-center">{inv.quote_number}</td>
                  <td className="py-2 px-4 text-center">{inv.quote_date}</td>
                  <td className="py-2 px-4 text-center">{inv.total_amount}</td>
                  <td className="py-2 px-4 text-center">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <span className="text-gray-500">No quotes found.</span>
        )}
      </div>

      {/* Proforma Invoices Section */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">PROFORMA INVOICES</h3>
        {proformas.length > 0 ? (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-green-50 text-green-800">
                <th className="py-1 ">Proforma No </th>
                <th className="py-1">Date</th>
                <th className="py-1">Amount</th>
                <th className="py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {proformas.map((inv) => (
                <tr key={inv.id} className="border-b">
                  <td className="py-2 px-4 text-center">{inv.invoice_number}</td>
                  <td className="py-2 px-4 text-center">{inv.invoice_date}</td>
                  <td className="py-2 px-4 text-center">{inv.total_amount}</td>
                  <td className="py-2 px-4 text-center">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <span className="text-gray-500">No Proforma found.</span>
        )}
      </div>

      {/* Delivery Challans Section */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">DELIVERY CHALLANS</h3>
        {challans.length > 0 ? (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-green-50 text-green-800">
                <th className="py-1">Challan No</th>
                <th className="py-1">Date</th>
                <th className="py-1">Amount</th>
                <th className="py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((inv) => (
                <tr key={inv.id} className="border-b">
                  <td className="py-2 px-2 text-center">{inv.challan_number}</td>
                  <td className="py-2 px-2 text-center">{inv.date}</td>
                  <td className="py-2 px-2 text-center">{inv.total_amount}</td>
                  <td className="py-2 px-2 text-center">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <span className="text-gray-500">No invoices found.</span>
        )}
      </div>
    </div>
  );
}
