"use client";

import { Upload, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/auth/tokenservice";
import { generatePDF } from "@/lib/pdf/pdfgenerator";

type CustomerType = {
  id: number;
  display_name: string;
};

type Customer = {
  id: number;
  display_name: string;
  billing_attention: string;
  billing_street1: string;
  billing_street2: string;
  billing_city: string;
  billing_state: string;
  billing_pin_code: string;
  billing_country: string;
  billing_phone: string;
  shipping_attention: string;
  shipping_street1: string;
  shipping_street2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pin_code: string;
  shipping_country: string;
  shipping_phone: string;
};

type ItemType = {
  id: number;
  name: string;
  sales_selling_price: number | string;
};

type InvoiceItem = {
  id: string;
  itemId?: number;
  name: string;
  qty: number;
  rate: number;
};

export default function InvoiceFormPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [itemsList, setItemsList] = useState<ItemType[]>([]);

  const [logo, setLogo] = useState<string>("");
  
    useEffect(() => {
    (async () => {
      const base64Logo = await getBase64FromUrl("/logo.png");
      setLogo(base64Logo); // put this in a useState
    })();
  }, []);

  // Invoice form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(Date.now() / 1000) % 100000}`);
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomer(null);
      return;
    }
    async function loadCustomer() {
      try {
        const res = await fetchWithAuth(
          `https://web-production-6baf3.up.railway.app/api/customers/${selectedCustomerId}/`
        );
        const data = await res.json();
        setCustomer(data);
      } catch (err) {
        console.error("Failed to load customer", err);
      }
    }
    loadCustomer();
  }, [selectedCustomerId]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerName("");
    } else {
      const cust = customers.find(c => c.id === selectedCustomerId);
      setCustomerName(cust?.display_name ?? "");
    }
  }, [selectedCustomerId, customers]);

  function formatAddress(cust: Customer, type: "billing" | "shipping") {
    return [
      cust[`${type}_attention` as keyof Customer],
      cust[`${type}_street1` as keyof Customer],
      cust[`${type}_street2` as keyof Customer],
      `${cust[`${type}_city` as keyof Customer]}, ${cust[`${type}_state` as keyof Customer]} ${cust[`${type}_pin_code` as keyof Customer]}`,
      cust[`${type}_country` as keyof Customer],
      cust[`${type}_phone` as keyof Customer] ? `Phone: ${cust[`${type}_phone` as keyof Customer]}` : null,
    ].filter(Boolean).join("\n");
  }

  // Fetch customers
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/customers/");
        const data = await res.json();
        setCustomers(data.results || []);
      } catch (e) {
        console.error("Failed to load customers", e);
      }
    }
    fetchCustomers();
  }, []);

  // Fetch available items
  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/items/");
        const data = await res.json();
        setItemsList(data.results || []);
      } catch (e) {
        console.error("Failed to load items", e);
      }
    }
    fetchItems();
  }, []);

  // Calculate totals
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.rate, 0);
  const taxRate = 18; // Example tax
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), itemId: undefined, name: "", qty: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item with selected item info
  const updateItemSelection = (index: number, itemId: number) => {
    const selectedItem = itemsList.find((item) => item.id === itemId);
    if (!selectedItem) return;
    setItems((currItems) =>
      currItems.map((item, i) =>
        i === index
          ? {
              ...item,
              itemId,
              name: selectedItem.name,
              rate: typeof selectedItem.sales_selling_price === "string" ? Number(selectedItem.sales_selling_price) : selectedItem.sales_selling_price,
            }
          : item
      )
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Save invoice handler, with POST to backend
  const saveInvoice = async (status: "Draft" | "Paid") => {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    const payload = {
      customer_id: selectedCustomerId,
      invoice_number: invoiceNumber,
      order_number: orderNumber,
      invoice_date: invoiceDate,
      customer_notes: notes,
      terms_and_conditions: terms,
      total_amount: total.toFixed(2), // Adjust as needed
      status,
      item_details: items
        .filter((i) => i.itemId !== undefined)
        .map((i) => ({
          item_id: i.itemId,
          quantity: i.qty,
          rate: i.rate,
          amount: (i.qty * i.rate).toFixed(2),
        })),
      // handle files upload separately or via multipart form data
    };

    try {
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/invoices/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to save invoice: ${JSON.stringify(err)}`);
        return;
      }

      if (status === "Draft") {
      const customerObj = customers.find((c) => c.id === selectedCustomerId);
      if (!customerObj) {
        alert("Customer data not available for PDF generation");
      } else {
        const billTo = formatAddress(customer!, "billing");
        const shipTo = formatAddress(customer!, "shipping");
        generatePDF({
          title: "INVOICE",
          documentNumber: invoiceNumber,
          documentDate: invoiceDate,
          expiryDate: "", // optionally add if relevant
          customerName: customerName,
          billTo: billTo, // add billing address if available
          shipTo: shipTo, // add shipping address if available
          placeOfSupply: "", // add state or country if available
          items: items.map((i) => ({
            name: i.name,
            hsn: "853200", // replace with actual HSN code if available
            qty: i.qty,
            rate: i.rate,
          })),
          subTotal: subtotal,
          taxBreakup: [
            { label: "GST", pct: taxRate, amount: taxAmount },
          ],
          total,
          totalInWords: "Indian Rupees " + total.toFixed(2) + " Only",
          notes,
          terms,
          logo,  // base64 image string loaded earlier
        });
      }
    }

      alert(`Invoice ${status === "Paid" ? "Paid" : "saved as DRAFT"} successfully.`);
      router.push("/books/sales/invoice");
    } catch (err) {
      alert("Error saving invoice.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-green-50">
      <h1 className="text-3xl mb-6 text-green-800 font-semibold">
        New Invoice
      </h1>
      <div className="p-6 bg-white border rounded-lg shadow-sm space-y-6">
        {/* Customer and Invoice Header */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-sm font-medium">Customer Name *</label>
            <select
              className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-green-500"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
            >
              <option value="">Select or add a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Invoice#</label>
            <input
              type="text"
              className="w-full p-2 border rounded text-sm bg-gray-50"
              value={invoiceNumber}
              readOnly
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Order Number</label>
            <input
              type="text"
              className="w-full p-2 border rounded text-sm"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Invoice Date *</label>
            <input
              type="date"
              className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-green-500"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="mb-3 text-lg font-semibold">Items & Charges</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 overflow-hidden border rounded-lg">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Item Details</th>
                    <th className="w-20 p-2 text-left">Qty</th>
                    <th className="w-24 p-2 text-left">Rate</th>
                    <th className="p-2 text-left w-28">Amount</th>
                    <th className="w-8 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} className="border-b">
                      <td className="p-2">
                        <select
                          className="w-full p-1 border rounded"
                          value={item.itemId ?? ""}
                          onChange={(e) => updateItemSelection(idx, Number(e.target.value))}
                        >
                          <option value="">Select item</option>
                          {itemsList.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          className="w-full p-1 border rounded"
                          value={item.qty}
                          onChange={(e) =>
                            setItems(
                              items.map((it, i) =>
                                i === idx ? { ...it, qty: Number(e.target.value) } : it
                              )
                            )
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          className="w-full p-1 border rounded"
                          value={item.rate}
                          onChange={(e) =>
                            setItems(
                              items.map((it, i) =>
                                i === idx ? { ...it, rate: Number(e.target.value) } : it
                              )
                            )
                          }
                        />
                      </td>
                      <td className="p-2">₹{(item.qty * item.rate).toFixed(2)}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => removeItem(idx)}>
                          <X size={16} className="text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={addItem}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-600 hover:underline"
              >
                <Plus size={14} /> Add New Row
              </button>
            </div>

            {/* Totals calculations */}
            <div className="p-4 border rounded-lg bg-gray-50 h-fit">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Sub Total</span>
                <span className="text-sm">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">GST ({taxRate}%)</span>
                <span className="text-sm">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 mt-2 font-semibold text-green-700 border-t">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-1 text-sm font-medium">Customer Notes</label>
          <textarea
            className="w-full p-2 text-sm border rounded"
            placeholder="Thanks for your business."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Terms and File Upload */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-sm font-medium">Terms & Conditions</label>
            <textarea
              className="w-full p-2 text-sm border rounded"
              placeholder="Enter the terms and conditions..."
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium">Attach File(s)</label>
            <div className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100">
              <Upload size={16} className="text-green-600" />
              <input type="file" multiple onChange={handleFileChange} className="text-sm" />
            </div>
            {/* Optionally display selected file names here */}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-0 flex justify-end gap-2 py-3 mt-4 border-t bg-gray-50">
        <button
          onClick={() => saveInvoice("Draft")}
          className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
        >
          Save as Draft
        </button>
        <button
          onClick={() => saveInvoice("Paid")}
          className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
        >
          Save and Send
        </button>
        <button
          onClick={() => router.push("/books/sales/invoice")}
          className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}