"use client";

import { useRouter, useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";

type ItemRow = { id: string; itemId?: string; name: string; qty: number; rate: number };

const STORAGE_KEY = "quotes";

export default function EditQuotePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [reference, setReference] = useState("");
  const [quoteDate, setQuoteDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [salesperson, setSalesperson] = useState("");
  const [projectName, setProjectName] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [taxType, setTaxType] = useState<"TDS" | "TCS">("TDS");
  const [taxPct, setTaxPct] = useState(0);
  const [adjustment, setAdjustment] = useState(0);

  // Status states for new field
  const [status, setStatus] = useState("draft");
  const [statusChoices, setStatusChoices] = useState<{ value: string; display: string }[]>([]);

  // Items fetched for mapping itemId to item name
  const [itemMap, setItemMap] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all items once to build map of id -> name
  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetchWithAuth("https://bom-front-production.up.railway.app/api/items/");
        if (!res.ok) throw new Error("Failed to fetch items");
        const data = await res.json();
        // Adjust this if your API returns paginated structure
        const itemsArray = Array.isArray(data) ? data : data.results || [];
        const map: Record<string, string> = {};
        itemsArray.forEach((item: any) => {
          map[item.id.toString()] = item.name;
        });
        setItemMap(map);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    }

    fetchItems();
  }, []);

  // Calculate totals
  const subTotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0),
        0
      ),
    [items]
  );

  const discountAmt = useMemo(
    () => (subTotal * (Number(discountPct) || 0)) / 100,
    [subTotal, discountPct]
  );

  const taxAmt = useMemo(() => {
    const base = ((subTotal - discountAmt) * (Number(taxPct) || 0)) / 100;
    return taxType === "TDS" ? -base : base;
  }, [subTotal, discountAmt, taxPct, taxType]);

  const total = useMemo(
    () => subTotal - discountAmt + taxAmt + (Number(adjustment) || 0),
    [subTotal, discountAmt, taxAmt, adjustment]
  );

  // Load quote data on mount
  useEffect(() => {
    if (!id) return;
    async function fetchQuote() {
      setLoading(true);
      setError("");
      try {
        const res = await fetchWithAuth(
          `https://bom-front-production.up.railway.app/api/quotes/${id}/`
        );
        if (!res.ok) throw new Error(`Failed to fetch quote: ${res.status}`);
        const data = await res.json();
        console.log(data);

        setCustomerId(data.customer?.id || null);
        setCustomerName(data.customer?.display_name || "");
        setQuoteNumber(data.quote_number || "");
        setReference(data.reference_number || "");
        setQuoteDate(data.quote_date || "");
        setExpiryDate(data.expiry_date || "");
        setSalesperson(data.salesperson || "");
        setProjectName(data.project_name || "");
        setSubject(data.subject || "");
        setNotes(data.customer_notes || "");
        setTerms(data.terms_and_conditions || "");
        setDiscountPct(Number(data.discount) || 0);
        setTaxPct(Number(data.tax_percentage) || 0);
        setTaxType(data.tax_type || "TDS");
        setAdjustment(Number(data.adjustment) || 0);

        // Set status and status choices from backend or fallback defaults
        setStatus(data.status || "draft");
        setStatusChoices(
          data.status_choices || [
            { value: "draft", display: "Draft" },
            { value: "sent", display: "Sent" },
            { value: "accepted", display: "Accepted" },
            { value: "rejected", display: "Rejected" },
            { value: "expired", display: "Expired" },
          ]
        );

        // Map item details using itemMap for name
        if (Array.isArray(data.item_details) && data.item_details.length > 0) {
          setItems(
            data.item_details.map((item: any) => ({
              id: item.id?.toString() || crypto.randomUUID(),
              itemId: item.item_id?.toString() || undefined,
              name: itemMap[item.item_id?.toString() || ""] || "",
              qty: item.quantity || 1,
              rate: Number(item.rate) || 0,
            }))
          );
        } else {
          setItems([{ id: crypto.randomUUID(), name: "", qty: 1, rate: 0 }]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load quote");
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [id, itemMap]);

  const addRow = () =>
    setItems((rows) => [...rows, { id: crypto.randomUUID(), name: "", qty: 1, rate: 0 }]);

  const removeRow = (id: string) =>
    setItems((rows) => (rows.length === 1 ? rows : rows.filter((r) => r.id !== id)));

  const updateRow = (id: string, patch: Partial<ItemRow>) =>
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  async function updateQuote() {
    if (!quoteNumber.trim()) {
      alert("Quote Number is required");
      return;
    }
    if (!customerName.trim()) {
      alert("Customer Name is required");
      return;
    }
    if (!quoteDate) {
      alert("Quote Date is required");
      return;
    }

    // Prepare payload matching your backend's expected structure
    const payload = {
      customer_id: customerId,
      quote_number: quoteNumber,
      reference_number: reference,
      quote_date: quoteDate,
      expiry_date: expiryDate,
      salesperson,
      project_name: projectName,
      subject,
      customer_notes: notes,
      terms_and_conditions: terms,
      discountPct,
      tax_type: taxType,
      tax_percentage: taxPct,
      adjustment,
      status, // include the status field here
      item_details: items.map((i) => ({
        // Use itemId in item field to map correctly
        item_id: i.itemId || null,
        quantity: i.qty,
        rate: i.rate,
      })),
    };

    try {
      const res = await fetchWithAuth(`https://bom-front-production.up.railway.app/api/quotes/${id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert("Failed to update quote: " + JSON.stringify(errorData));
        return;
      }
      router.push("/books/sales/quotes");
    } catch (err) {
      alert("Unexpected error updating quote.");
      console.error(err);
    }
  }

  if (loading) return <p>Loading quote details...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <h1 className="mb-6 text-2xl font-bold text-green-800">Edit Quote</h1>

      <div className="p-6 space-y-8 bg-white shadow-md rounded-2xl">
        {/* Top grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-green-800">Customer Name*</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Select or add a customer"
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-green-800">Quote #*</label>
            <input
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-800">Reference # (optional)</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-800">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            >
              {statusChoices.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.display}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-800">Quote Date*</label>
              <input
                type="date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-800">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-800">Salesperson</label>
            <input
              value={salesperson}
              onChange={(e) => setSalesperson(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-green-800">Project Name</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-green-800">Subject</label>
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Let your customer know what this Quote is for"
            className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-green-700">Item Table</h2>
            <span className="text-sm text-green-700/80">Bulk Actions</span>
          </div>

          <div className="overflow-hidden border rounded-xl">
            <table className="w-full">
              <thead className="text-green-900 bg-green-200">
                <tr>
                  <th className="p-2 text-left">Item Details</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Rate</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b bg-green-50">
                    <td className="p-2">
                      <input
                        value={row.name}
                        onChange={(e) => updateRow(row.id, { name: e.target.value })}
                        placeholder="Type or click to select an item"
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.qty}
                        onChange={(e) => updateRow(row.id, { qty: Number(e.target.value) })}
                        className="w-24 px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.rate}
                        onChange={(e) => updateRow(row.id, { rate: Number(e.target.value) })}
                        className="px-2 py-1 border rounded w-28"
                      />
                    </td>
                    <td className="p-2 font-medium">
                      ₹{(Number(row.qty) * Number(row.rate)).toFixed(2)}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3 mt-3">
            <button
              onClick={addRow}
              className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
            >
              + Add New Row
            </button>
            <button className="px-4 py-2 border rounded-lg hover:bg-green-100">
              + Add Items in Bulk
            </button>
          </div>
        </div>

        {/* Totals card */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-green-800">Customer Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="p-4 space-y-3 border bg-green-50 rounded-2xl">
            <div className="flex justify-between">
              <span className="text-green-900">Sub Total</span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-green-900">Discount</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPct}
                  onChange={(e) => setDiscountPct(Number(e.target.value))}
                  className="w-24 px-2 py-1 border rounded"
                />
                <span>%</span>
                <span className="text-sm text-gray-600">₹{discountAmt.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={taxType === "TDS"}
                    onChange={() => setTaxType("TDS")}
                  />
                  TDS
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    checked={taxType === "TCS"}
                    onChange={() => setTaxType("TCS")}
                  />
                  TCS
                </label>
              </div>
              <select
                value={taxPct}
                onChange={(e) => setTaxPct(Number(e.target.value))}
                className="px-2 py-1 border rounded"
              >
                {[0, 5, 12, 18, 28].map((t) => (
                  <option key={t} value={t}>
                    {t}% Tax
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">
                {taxType === "TDS" ? "-" : "+"}₹{Math.abs(taxAmt).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-green-900">Adjustment</label>
              <input
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(Number(e.target.value))}
                className="px-2 py-1 border rounded w-28"
              />
            </div>

            <div className="flex justify-between pt-2 text-lg font-semibold text-green-800 border-t">
              <span>Total (₹)</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800">Terms & Conditions</label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Footer buttons */}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            onClick={() => updateQuote()}
            className="px-4 py-2 border rounded-lg hover:bg-green-100"
          >
            Save as Draft
          </button>
          <button
            onClick={() => updateQuote()}
            className="px-4 py-2 text-white bg-green-600 rounded-lg shadow hover:bg-green-700"
          >
            Save and Send
          </button>
          <button
            onClick={() => router.push("/quotes")}
            className="px-4 py-2 border rounded-lg hover:bg-red-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
