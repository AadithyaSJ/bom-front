"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { FaSave, FaTimes, FaCalendarAlt, FaRupeeSign, FaHashtag, FaStickyNote, FaUser, FaExchangeAlt, FaArrowRight } from "react-icons/fa";

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
};

const SOURCE_TYPES = ["vendor", "customer", "bank", "cash"]; // Update as needed
const DESTINATION_TYPES = ["vendor", "customer", "bank", "cash"];
const TRANSACTION_TYPES = ["payment", "receipt", "transfer"]; // Update as needed

export default function EditTransactionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Controlled form state for each field
  const [sourceType, setSourceType] = useState("");
  const [sourceId, setSourceId] = useState<number | "">("");
  const [destinationType, setDestinationType] = useState("");
  const [destinationId, setDestinationId] = useState<number | "">("");
  const [transactionType, setTransactionType] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    async function fetchTransaction() {
      setLoading(true);
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/banking/transactions/${id}/`
        );
        if (!res.ok) {
          setTransaction(null);
        } else {
          const data = await res.json();
          setTransaction(data);
          setSourceType(data.source_type || "");
          setSourceId(data.source_id ?? "");
          setDestinationType(data.destination_type || "");
          setDestinationId(data.destination_id ?? "");
          setTransactionType(data.transaction_type || "");
          setName(data.name || "");
          setDate(data.date || "");
          setAmount(data.amount ?? "");
          setDescription(data.description || "");
          setReferenceNumber(data.reference_number || "");
        }
      } catch {
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    }
    fetchTransaction();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !name.trim() ||
      !date ||
      amount === "" ||
      !sourceType ||
      sourceId === "" ||
      !destinationType ||
      destinationId === "" ||
      !transactionType
    ) {
      setError("All main fields are required");
      return;
    }

    const payload = {
      ...transaction,
      source_type: sourceType,
      source_id: typeof sourceId === "string" ? Number(sourceId) : sourceId,
      destination_type: destinationType,
      destination_id: typeof destinationId === "string" ? Number(destinationId) : destinationId,
      transaction_type: transactionType,
      name,
      date,
      amount: typeof amount === "string" ? Number(amount) : amount,
      description,
      reference_number: referenceNumber,
    };

    try {
      setSubmitting(true);
      const res = await fetchWithAuth(
  `https://web-production-6baf3.up.railway.app/api/banking/transactions/${id}/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(JSON.stringify(data, null, 2));
        setSubmitting(false);
        return;
      }
      router.push(`/books/transactions/${id}`);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return <div className="p-6">Loading transaction...</div>;
  if (!transaction)
    return (
      <div className="p-6 text-red-600">Transaction not found.</div>
    );

  return (
    <div className="bg-green-50 min-h-screen py-10 px-2">
      <div className="w-full max-w-xl mx-auto bg-white shadow rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-green-800 flex items-center gap-3">
            <FaUser className="inline text-green-700" />
            Edit Transaction
          </h1>
          <button
            className="text-green-700 border border-green-700 rounded px-4 py-2"
            onClick={() => router.push(`/books/transactions/${id}`)}
            type="button"
          >
            <FaTimes className="inline mr-1" />
            Cancel
          </button>
        </div>
        <form
          className="grid gap-6"
          onSubmit={handleSubmit}
          autoComplete="off"
          noValidate
        >
          {/* Transaction Type */}
          <div>
            <label className="block mb-1 text-green-700 font-medium" htmlFor="transaction_type">
              <FaExchangeAlt className="inline mr-1" /> Transaction Type<span className="text-red-500">*</span>
            </label>
            <select
              id="transaction_type"
              className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 capitalize"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              required
            >
              <option value="">Select a type</option>
              {TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {/* Source Type/ID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-green-700 font-medium" htmlFor="source_type">
                <FaArrowRight className="inline mr-1" /> Source Type<span className="text-red-500">*</span>
              </label>
              <select
                id="source_type"
                className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 capitalize"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                required
              >
                <option value="">Select a source</option>
                {SOURCE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-green-700 font-medium" htmlFor="source_id">
                Source ID<span className="text-red-500">*</span>
              </label>
              <input
                id="source_id"
                className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                type="number"
                min="0"
                value={sourceId}
                onChange={(e) =>
                  setSourceId(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
                placeholder="Source ID"
              />
            </div>
          </div>
          {/* Dest Type/ID */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-green-700 font-medium" htmlFor="destination_type">
                <FaArrowRight className="inline mr-1 rotate-180" /> Destination Type<span className="text-red-500">*</span>
              </label>
              <select
                id="destination_type"
                className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:border-green-500 capitalize"
                value={destinationType}
                onChange={(e) => setDestinationType(e.target.value)}
                required
              >
                <option value="">Select a destination</option>
                {DESTINATION_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-green-700 font-medium" htmlFor="destination_id">
                Destination ID<span className="text-red-500">*</span>
              </label>
              <input
                id="destination_id"
                className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
                type="number"
                min="0"
                value={destinationId}
                onChange={(e) =>
                  setDestinationId(e.target.value === "" ? "" : Number(e.target.value))
                }
                required
                placeholder="Destination ID"
              />
            </div>
          </div>
          {/* Name */}
          <div>
            <label className="block mb-1 text-green-700 font-medium" htmlFor="txname">
              <FaUser className="inline mr-1" /> Name<span className="text-red-500">*</span>
            </label>
            <input
              id="txname"
              className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter name"
            />
          </div>
          {/* Date */}
          <div>
            <label className="block mb-1 text-green-700 font-medium" htmlFor="txdate">
              <FaCalendarAlt className="inline mr-1" /> Date<span className="text-red-500">*</span>
            </label>
            <input
              id="txdate"
              className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          {/* Amount */}
          <div>
            <label className="block mb-1 text-green-700 font-medium" htmlFor="amount">
              <FaRupeeSign className="inline mr-1" /> Amount<span className="text-red-500">*</span>
            </label>
            <input
              id="amount"
              className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
              placeholder="Enter amount"
            />
          </div>
          {/* Description */}
          <div>
            <label className="block mb-1 text-green-700 font-medium" htmlFor="description">
              <FaStickyNote className="inline mr-1" /> Description
            </label>
            <input
              id="description"
              className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
            />
          </div>
          {/* Reference Number */}
          <div>
            <label className="block mb-1 text-green-700 font-medium" htmlFor="reference">
              <FaHashtag className="inline mr-1" /> Reference #
            </label>
            <input
              id="reference"
              className="w-full border border-green-300 rounded px-3 py-2 focus:outline-none focus:border-green-500"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Reference number"
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm whitespace-pre">{error}</p>
          )}
          <div className="flex justify-end gap-4 mt-2">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded px-6 py-2 flex items-center gap-2"
              disabled={submitting}
            >
              <FaSave className="inline" />
              {submitting ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="text-green-700 border border-green-700 rounded px-6 py-2 flex items-center gap-2"
              onClick={() => router.push(`/books/transactions/${id}`)}
            >
              <FaTimes className="inline" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
