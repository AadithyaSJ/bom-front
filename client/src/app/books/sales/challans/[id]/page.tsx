"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { FaEnvelope, FaPhone, FaUser } from "react-icons/fa";

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
  billing_attention?: string;
  billing_country?: string;
  billing_street1?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_pin_code?: string;
  shipping_attention?: string;
  shipping_country?: string;
  shipping_street1?: string;
  shipping_street2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pin_code?: string;
  contact_persons?: ContactPerson[];
  tags?: string[];
  remarks?: string;
};

type ChallanItemDetail = {
  id: number;
  item: Item;
  quantity: number;
  rate: string;
  amount: string;
  delivery_challan_item_number: number;
};

type Challan = {
  id: number;
  customer: Customer;
  challan_number: string;
  reference_number: string;
  date: string;
  delivery_date?: string;
  challan_type: string;
  item_details: ChallanItemDetail[];
  total_amount: string;
  notes?: string;
  status?:string;
  delivery_challan_files: { id: number; file: string; uploaded_at: string }[];
  created_at: string;
};

export default function ChallanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchChallan() {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/deliverychallans/${id}/`
        );
        if (!res.ok) throw new Error("Failed to fetch challan data");
        const data: Challan = await res.json();
        setChallan(data);
      } catch (err) {
        setError("Failed to load challan data");
      } finally {
        setLoading(false);
      }
    }
    fetchChallan();
  }, [id]);

  if (loading) return <p>Loading challan details...</p>;
  if (error || !challan) return <p className="text-red-600">{error || "Challan not found"}</p>;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-green-800">
          Delivery Challan: {challan.challan_number}
        </h2>
        <button
          className="text-green-700 border border-green-200 rounded px-4 py-1 hover:bg-green-50"
          onClick={() => router.back()}
        >
          Back
        </button>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <h3 className="font-semibold text-green-700 mb-2">Customer Info</h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-green-700">
            <FaUser /> {challan.customer.display_name}
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <FaEnvelope /> {challan.customer.email}
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <FaPhone /> {challan.customer.work_phone}
          </div>
        </div>
        <div className="text-sm mt-4">
          Company: {challan.customer.company_name} <br />
          Type: {challan.customer.customer_type === "business" ? "Business" : "Individual"}
        </div>
      </div>

      {/* Challan Details */}
      <div className="mt-6">
        <h3 className="font-semibold text-green-700 mb-2">Challan Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-700">Reference Number:</span> {challan.reference_number}</div>
          <div><span className="text-gray-700">Date:</span> {challan.date}</div>
          {challan.delivery_date && (
            <div><span className="text-gray-700">Delivery Date:</span> {challan.delivery_date}</div>
          )}
          <div><span className="text-gray-700">Challan Type:</span> {challan.challan_type}</div>
          <div>
            <span className="text-gray-700">Status:</span>{" "}
            <span className="text-gray-900">{challan.status}</span>
          </div>
        </div>
      </div>

     <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">Amount Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-700">Total Amount:</span>{" "}
            <span className="text-gray-900 font-bold">₹{parseFloat(challan.total_amount).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Item Details */}
      <div className="mt-8">
        <h3 className="font-semibold text-green-700 mb-2">Item Details</h3>
        {challan.item_details && challan.item_details.length > 0 ? (
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
              {challan.item_details.map((detail, idx) => (
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

      {/* Notes */}
      {challan.notes && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">Notes</h3>
          <p className="text-gray-800">{challan.notes}</p>
        </div>
      )}

      {/* Files */}
      {challan.delivery_challan_files && challan.delivery_challan_files.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-green-700 mb-2">Files</h3>
          <ul className="list-disc pl-5 text-sm text-green-700">
            {challan.delivery_challan_files.map((f) => (
              <li key={f.id}>
                <a href={f.file} target="_blank" rel="noopener noreferrer" className="underline">
                  {f.file}
                </a> (uploaded at {new Date(f.uploaded_at).toLocaleString()})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
