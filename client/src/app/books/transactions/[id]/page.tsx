"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/auth/tokenservice";
import { FaListUl, FaCalendarAlt, FaRupeeSign, FaStickyNote, FaHashtag, FaArrowRight, FaExchangeAlt, FaClock } from "react-icons/fa";

// Transaction type
type Transaction = {
  id: number;
  source_type: string;
  source_id: number;
  destination_type: string;
  destination_id: number;
  transaction_type: string;
  name: string;
  date: string;
  amount: number;
  description: string;
  reference_number?: string;
  created_at?: string;
  updated_at?: string;
};

export default function TransactionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransaction() {
      setLoading(true);
      try {
  const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/banking/transactions/${id}/`);
        if (!res.ok) throw new Error("Transaction not found");
        const data = await res.json();
        setTransaction(data);
        setError(null);
      } catch (e) {
        setTransaction(null);
        setError("Transaction not found");
      } finally {
        setLoading(false);
      }
    }
    fetchTransaction();
  }, [id]);

  if (loading) return <div className="p-6">Loading transaction details...</div>;
  if (error || !transaction)
    return <div className="p-6 text-red-600">{error || "Transaction not found"}</div>;

  return (
    <div className="bg-green-50 min-h-screen py-10 px-2">
      <div className="w-full max-w-3xl mx-auto bg-white shadow rounded-xl p-8">
        {/* Header and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-green-800 flex items-center gap-3">
              <FaListUl className="inline text-green-700" />
              Transaction: <span className="text-green-900">#{transaction.id}</span>
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-green-700">
              <FaClock /> 
              Created: {transaction.created_at?.replace("T", " ").slice(0, 19)} | 
              Updated: {transaction.updated_at?.replace("T", " ").slice(0, 19)}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/books/transactions/${transaction.id}/edit`}
              className="text-white bg-green-600 hover:bg-green-700 rounded px-4 py-2 font-semibold"
            >
              Edit
            </Link>
            <button
              className="text-green-700 border border-green-700 rounded px-4 py-2"
              onClick={() => router.push('/books/transactions')}
            >
              Back
            </button>
          </div>
        </div>
        
        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <FaExchangeAlt /> <span>Transaction Type:</span>
            </div>
            <div className="text-gray-900 capitalize mb-4">{transaction.transaction_type}</div>

            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <FaHashtag /> <span>Reference Number:</span>
            </div>
            <div className="text-gray-900 mb-4">{transaction.reference_number || <span className="text-gray-400">—</span>}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <FaCalendarAlt /> <span>Date:</span>
            </div>
            <div className="text-gray-900 mb-4">{transaction.date}</div>

            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <FaRupeeSign /> <span>Amount:</span>
            </div>
            <div className="text-gray-900 text-lg font-semibold mb-4">₹{transaction.amount.toFixed(2)}</div>
          </div>
        </div>
        
        <hr className="my-8 border-green-100" />

        {/* Parties Section */}
        <div className="mb-7">
          <div className="flex items-center gap-3 text-green-700 font-semibold mb-2">
            <FaArrowRight /> Source &rarr; Destination
          </div>
          <div className="flex flex-col gap-2 ml-2">
            <div>
              <span className="font-medium text-green-700 capitalize">Source:</span>{" "}
              <span className="text-gray-900">{transaction.source_type} (ID: {transaction.source_id})</span>
            </div>
            <div>
              <span className="font-medium text-green-700 capitalize">Destination:</span>{" "}
              <span className="text-gray-900">{transaction.destination_type} (ID: {transaction.destination_id})</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-2">
          <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
            <FaStickyNote /> <span>Description:</span>
          </div>
          <div className="bg-green-50 text-gray-900 rounded px-4 py-2 min-h-[40px]">
            {transaction.description ? transaction.description : <span className="text-gray-400">No description.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
