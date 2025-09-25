"use client";
import { useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";
import { useRouter } from "next/navigation";

export default function NewTransactionPage() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState("customer");
  const [sourceId, setSourceId] = useState("");
  const [destinationType, setDestinationType] = useState("vendor");
  const [destinationId, setDestinationId] = useState("");
  const [transactionType, setTransactionType] = useState("payment");
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!sourceId || !destinationId || !amount) {
      setError("Source, Destination, and Amount are required.");
      return;
    }

    const payload = {
      source_type: sourceType,
      source_id: Number(sourceId),
      destination_type: destinationType,
      destination_id: Number(destinationId),
      transaction_type: transactionType,
      name,
      date,
      amount: Number(amount),
      description,
      reference_number: referenceNumber,
    };

    try {
      setLoading(true);
  const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/banking/transactions/", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
    const text = await res.text();
    console.error("API Error:", res.status, text);
    throw new Error("Failed to save transaction");
}
      router.push("/books/transactions"); // Go back to transactions list
    } catch (err) {
      setError("Error saving transaction");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <h1 className="mb-6 text-2xl font-bold text-green-900">New Transaction</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full h-full">
        <div className="grid gap-4">
          <label>
            Source Type
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="border rounded p-2 w-full">
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="bank">Bank</option>
              <option value="credit_card">Credit Card</option>
            </select>
          </label>

          <label>
            Source ID
            <input type="number" value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="border rounded p-2 w-full" required />
          </label>

          <label>
            Destination Type
            <select value={destinationType} onChange={(e) => setDestinationType(e.target.value)} className="border rounded p-2 w-full">
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="bank">Bank</option>
              <option value="credit_card">Credit Card</option>
            </select>
          </label>

          <label>
            Destination ID
            <input type="number" value={destinationId} onChange={(e) => setDestinationId(e.target.value)} className="border rounded p-2 w-full" required />
          </label>

          <label>
            Transaction Type
            <select value={transactionType} onChange={(e) => setTransactionType(e.target.value)} className="border rounded p-2 w-full">
              <option value="payment">Payment</option>
              <option value="receipt">Receipt</option>
              <option value="transfer">Transfer</option>
              <option value="refund">Refund</option>
            </select>
          </label>

          <label>
            Name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border rounded p-2 w-full" />
          </label>

          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded p-2 w-full" required />
          </label>

          <label>
            Amount
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="border rounded p-2 w-full" required />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="border rounded p-2 w-full" />
          </label>

          <label>
            Reference Number
            <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="border rounded p-2 w-full" />
          </label>

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
            <button type="button" className="px-4 py-2 border rounded" onClick={() => router.push("/books/transactions")}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
