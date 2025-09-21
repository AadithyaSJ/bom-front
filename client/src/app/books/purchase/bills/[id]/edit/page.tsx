"use client";

import { useState, useEffect, ChangeEvent, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { FaUpload, FaTrash, FaPlus } from "react-icons/fa";

type Item = { id: string; name: string };
type Vendor = { id: number; display_name: string };
type FileBlob = { id: string; name: string; size: number; type: string; dataUrl: string };
type BillItem = { id: string; name: string; qty: number; rate: number; taxPct: number; desc: string };
type Bill = {
  id: string;
  bill_number: string;
  reference_number: string;
  bill_date: string;
  due_date: string;
  status: string;
  vendor: Vendor;
  notes: string;
  meta?: { items: BillItem[]; files: FileBlob[] };
};

const billStatuses = ["PAID", "UNPAID", "PARTIAL", "DRAFT"];

const inputClass = "w-full border rounded px-2 py-1";

export default function BillEditPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params?.id ?? null;

  const [bill, setBill] = useState<Bill | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [billNumber, setBillNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [vendorId, setVendorId] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [files, setFiles] = useState<FileBlob[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [vRes, iRes] = await Promise.all([
          fetchWithAuth("https://bom-front-production.up.railway.app/api/vendors"),
          fetchWithAuth("https://bom-front-production.up.railway.app/api/items"),
        ]);
        if (vRes.ok) setVendors((await vRes.json()).results || []);
        if (iRes.ok) setItems((await iRes.json()).results || []);
      } catch {
        // handle errors or set empty
      }
    })();
  }, []);

  useEffect(() => {
    if (!billId) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetchWithAuth(`https://bom-front-production.up.railway.app/api/bills/${billId}`);
        if (!res.ok) throw new Error("Failed to fetch bill");
        const data: Bill = await res.json();
        setBill(data);

        setBillNumber(data.bill_number);
        setReferenceNumber(data.reference_number);
        setBillDate(data.bill_date);
        setDueDate(data.due_date);
        setStatus(data.status);
        setVendorId(data.vendor?.id ?? "");
        setNotes(data.notes);
        setBillItems(
          (data.meta?.items || []).map((item) => ({
            id: item.id || crypto.randomUUID(),
            name: item.name,
            qty: item.qty,
            rate: item.rate,
            taxPct: item.taxPct,
            desc: item.desc || "",
          }))
        );
        setFiles(data.meta?.files || []);
      } catch (e) {
        // handle error
      }
      setLoading(false);
    })();
  }, [billId]);

  const subtotal = useMemo(() => billItems.reduce((acc, i) => acc + i.qty * i.rate, 0), [billItems]);
  const taxTotal = useMemo(() => billItems.reduce((acc, i) => acc + i.qty * i.rate * (i.taxPct / 100), 0), [billItems]);
  const total = subtotal + taxTotal;

  function addItem() {
    setBillItems((curr) => [...curr, { id: crypto.randomUUID(), name: "", qty: 1, rate: 0, taxPct: 0, desc: "" }]);
  }

  function removeItem(id: string) {
    setBillItems((curr) => (curr.length > 1 ? curr.filter((i) => i.id !== id) : curr));
  }

  function updateItem(id: string, field: keyof BillItem, value: string | number) {
    setBillItems((curr) => curr.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 10 - files.length);
    Promise.all(
      selected.map((file) =>
        new Promise<FileBlob>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res({ id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type, dataUrl: String(reader.result) });
          reader.onerror = rej;
          reader.readAsDataURL(file);
        })
      )
    ).then((readFiles) => setFiles((curr) => [...curr, ...readFiles]));
    e.target.value = "";
  }

  function removeFile(id: string) {
    setFiles((curr) => curr.filter((f) => f.id !== id));
  }

  async function save() {
    if (!vendorId) {
      alert("Select a vendor");
      return;
    }
    if (!billNumber.trim()) {
      alert("Enter bill number");
      return;
    }
    const filteredItems = billItems.filter((i) => i.name.trim() && i.qty > 0);
    if (!filteredItems.length) {
      alert("Add at least one item");
      return;
    }

    const payload = {
      bill_number: billNumber.trim(),
      reference_number: referenceNumber.trim(),
      bill_date: billDate,
      due_date: dueDate,
      status,
      vendor_id: vendorId,
      notes,
      subtotal,
      tax: taxTotal,
      total_amount: total,
      item_details: filteredItems.map((i) => ({
        item_id: items.find((it) => it.name === i.name)?.id,
        quantity: i.qty,
        rate: i.rate,
        tax_pct: i.taxPct,
        desc: i.desc,
      })),
      attachment_ids: files.map((f) => f.id),
    };

    try {
      const token = localStorage.getItem("authToken") || "";
      const url = billId ? `https://bom-front-production.up.railway.app/api/bills/${billId}/` : "https://bom-front-production.up.railway.app/api/bills/";
      const method = billId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error saving bill: ${JSON.stringify(err)}`);
        return;
      }

      alert("Bill saved successfully!");
      router.push("/books/purchase/bills");
    } catch {
      alert("Error saving. Please try again.");
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container max-w-5xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">{billId ? "Edit Bill" : "New Bill"}</h1>

      <label>Vendor</label>
      <select className="border p-2 w-full rounded mb-4" value={vendorId} onChange={(e) => setVendorId(Number(e.target.value))}>
        <option value="">Select a vendor</option>
        {vendors.map((v) => (
          <option key={v.id} value={v.id}>{v.display_name}</option>
        ))}
      </select>

      <label>Bill Number</label>
      <input className="border p-2 w-full rounded mb-4" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} />

      <label>Reference Number</label>
      <input className="border p-2 w-full rounded mb-4" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />

      <label>Bill Date</label>
      <input type="date" className="border p-2 w-full rounded mb-4" value={billDate} onChange={(e) => setBillDate(e.target.value)} />

      <label>Due Date</label>
      <input type="date" className="border p-2 w-full rounded mb-4" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

      <label>Status</label>
      <select className="border p-2 w-full rounded mb-4" value={status} onChange={(e) => setStatus(e.target.value)}>
        {billStatuses.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Items */}
      <div>
  <h2 className="text-xl font-semibold mb-2">Items</h2>
  <button
    onClick={() => addItem()}
    className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
  >
    <FaPlus className="inline mr-2" />
    Add Item
  </button>
  <div className="overflow-auto border rounded shadow-sm">
    <table className="min-w-full table-fixed border-collapse">
      <thead className="bg-green-50 border-b border-green-300">
        <tr>
          <th className="py-2 px-3 text-left font-semibold text-green-700">Name</th>
          <th className="py-2 px-3 text-left font-semibold text-green-700">Description</th>
          <th className="py-2 px-3 text-left font-semibold text-green-700">Qty</th>
          <th className="py-2 px-3 text-left font-semibold text-green-700">Rate</th>
          <th className="py-2 px-3 text-left font-semibold text-green-700">Tax %</th>
          <th className="py-2 px-3 text-left font-semibold text-green-700">Amount</th>
          <th className="py-2 px-3"></th>
        </tr>
      </thead>
      <tbody>
        {billItems.map((item, idx) => {
          const bgColor = idx % 2 === 0 ? 'bg-white' : 'bg-green-50';
          const amount = item.qty * item.rate * (1 + (item.taxPct ?? 0) / 100);
          return (
            <tr key={item.id} className={`${bgColor} hover:bg-green-100 transition`}>
              <td className="p-2">
                <input
                  list="items-list"
                  value={item.name}
                  onChange={(e) => updateItemField(item.id, "name", e.target.value)}
                  className="w-full px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Item name"
                />
                <datalist id="items-list">
                  {items.map((it) => (
                    <option key={it.id} value={it.name} />
                  ))}
                </datalist>
              </td>
              <td className="p-2">
                <input
                  value={item.desc}
                  onChange={(e) => updateItemField(item.id, "desc", e.target.value)}
                  className="w-full px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Description"
                />
              </td>
              <td className="p-2 w-24">
                <input
                  type="number"
                  min={0}
                  value={item.qty}
                  onChange={(e) => updateItemField(item.id, "qty", Number(e.target.value))}
                  className="w-full px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </td>
              <td className="p-2 w-28">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.rate}
                  onChange={(e) => updateItemField(item.id, "rate", Number(e.target.value))}
                  className="w-full px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </td>
              <td className="p-2 w-24">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.taxPct}
                  onChange={(e) => updateItemField(item.id, "taxPct", Number(e.target.value))}
                  className="w-full px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </td>
              <td className="p-2 w-28 font-semibold text-green-700">₹ {amount.toFixed(2)}</td>
              <td className="p-2 text-center w-16">
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-800 font-bold"
                  aria-label="Remove item"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>


      {/* Attachments */}
     <div className="mt-6 bg-green-50 p-4 rounded shadow-sm">
  <h2 className="text-lg font-semibold mb-3">Attachments</h2>

  <label 
    className="inline-flex items-center gap-2 cursor-pointer text-green-700 hover:text-green-900"
    title="Upload Files"
  >
    <FaUpload className="text-green-600" />
    <span className="underline">Upload Files</span>
    <input
      type="file"
      multiple
      className="hidden"
      onChange={handleFileChange}
      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
    />
  </label>

  {files.length === 0 ? (
    <p className="mt-3 text-gray-600">No files uploaded.</p>
  ) : (
    <div className="mt-3 flex flex-wrap gap-3">
      {files.map(file => (
        <div
          key={file.id}
          className="flex items-center gap-2 bg-white border border-green-300 rounded px-3 py-1 shadow-sm"
        >
          <span className="truncate max-w-xs">{file.name}</span>
          <button
            onClick={() => removeFile(file.id)}
            className="text-red-600 hover:text-red-800 font-bold"
            title="Remove file"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )}
</div>


      {/* Notes */}
      <div>
        <label>Notes</label>
        <textarea className="border w-full p-2 rounded mb-6" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {/* Summary & Submit */}
      <div className="mt-6 p-4 bg-green-50 rounded shadow-md flex justify-between items-center sticky bottom-0">
  <div className="space-y-1 text-green-900 font-semibold">
    <div>Subtotal: ₹{subtotal.toFixed(2)}</div>
    <div>Tax: ₹{taxTotal.toFixed(2)}</div>
    <div className="text-xl border-t pt-2 border-green-700">Total: ₹{total.toFixed(2)}</div>
  </div>

  <div className="flex gap-3">
    <button
      onClick={() => router.back()}
      className="px-4 py-2 rounded border border-green-700 text-green-700 hover:bg-green-100"
    >
      Cancel
    </button>
    <button
      onClick={save}
      className="px-6 py-2 rounded bg-green-700 text-white hover:bg-green-800"
    >
      Save
    </button>
  </div>
</div>

    </div>
  );

  function updateItemField(id: string, field: keyof BillItem, value: any) {
    setBillItems((cur) => cur.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).slice(0, 10 - files.length);
    Promise.all(
      selected.map(
        (file) =>
          new Promise<FileBlob>((res, rej) => {
            const reader = new FileReader();
            reader.onload = () =>
              res({
                id: crypto.randomUUID(),
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: String(reader.result),
              });
            reader.onerror = rej;
            reader.readAsDataURL(file);
          })
      )
    ).then((readFiles) => setFiles((cur) => [...cur, ...readFiles]));
    e.target.value = "";
  }

}
