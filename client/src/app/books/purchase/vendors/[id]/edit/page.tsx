"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
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

type ContactPerson = {
  salutation: "dr" | "mr" | "ms" | "mrs" | "";
  first_name: string;
  last_name: string;
  email: string;
  work_phone: string;
  mobile: string;
};

type Address = {
  attention: string;
  country: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  pin_code: string;
  phone: string;
  fax: string;
};

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
  contact_persons: ContactPerson[];
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

export default function EditVendorPage() {
  const [documents, setDocuments] = useState<{ name: string; size: number; type: string }[]>([]);
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("Other Details");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputBase = "w-full rounded-md border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500";
  const withIcon = "flex items-center rounded-md border border-green-300 px-3 focus:ring-2 focus:ring-green-500";

  const [vendorType, setVendorType] = useState<Vendor["vendor_type"]>("business");
  const [salutation, setSalutation] = useState<Vendor["salutation"]>("");

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [company_name, setCompanyName] = useState("");
  const [display_name, setDisplayName] = useState("");

  const [email, setEmail] = useState("");
  const [work_phone, setWorkPhone] = useState("");
  const [mobile, setMobile] = useState("");

  const [pan, setPan] = useState("");
  const [currency, setCurrency] = useState("INR - Indian Rupee");
  const [opening_balance, setOpeningBalance] = useState(0);
  const [payment_terms, setPaymentTerms] = useState(PAYMENT_TERMS[0]);

  const [billing, setBilling] = useState<Address>({
    attention: "",
    country: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    pin_code: "",
    phone: "",
    fax: "",
  });

  const [shipping, setShipping] = useState<Address>({
    attention: "",
    country: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    pin_code: "",
    phone: "",
    fax: "",
  });

  const [contact_persons, setContactPersons] = useState<ContactPerson[]>([
    { salutation: "", first_name: "", last_name: "", email: "", work_phone: "", mobile: "" }
  ]);

  const [custom_fields, setCustomFields] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [remarks, setRemarks] = useState("");

  function removeDoc(idx: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  }

  function onDocSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const allowedFiles = files.filter((f) => f.size <= 10 * 1024 * 1024).slice(0, 10);
    const metas = allowedFiles.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    setDocuments((prev) => [...prev, ...metas].slice(0, 10));
    e.target.value = "";
  }
  
  useEffect(() => {
    if (!vendorId) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/vendors/${vendorId}/`);
        if (!res.ok) throw new Error("Failed to fetch vendor");
        const data: Vendor = await res.json();

        setVendorType(data.vendor_type);
        setSalutation(data.salutation);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setCompanyName(data.company_name);
        setDisplayName(data.display_name);
        setEmail(data.email);
        setWorkPhone(data.work_phone);
        setMobile(data.mobile);
        setPan(data.pan);
        const curr = CURRENCIES.find(c => c.startsWith(data.currency)) || data.currency;
        setCurrency(curr);
        setOpeningBalance(Number(data.opening_balance));
        setPaymentTerms(data.payment_terms);
        setDocuments(data.documents || []);

        setBilling({
          attention: data.billing_attention,
          country: data.billing_country,
          street1: data.billing_street1,
          street2: data.billing_street2,
          city: data.billing_city,
          state: data.billing_state,
          pin_code: data.billing_pin_code,
          phone: data.billing_phone,
          fax: data.billing_fax,
        });

        setShipping({
          attention: data.shipping_attention,
          country: data.shipping_country,
          street1: data.shipping_street1,
          street2: data.shipping_street2,
          city: data.shipping_city,
          state: data.shipping_state,
          pin_code: data.shipping_pin_code,
          phone: data.shipping_phone,
          fax: data.shipping_fax,
        });

        setContactPersons(data.contact_persons.length ? data.contact_persons : [{ salutation: "", first_name: "", last_name: "", email: "", work_phone: "", mobile: "" }]);
        const fields = Object.entries(data.custom_fields || {}).map(([key, value]) => ({ key, value }));
        setCustomFields(fields.length ? fields : [{ key: "", value: "" }]);
        setTags(data.tags || []);
        setRemarks(data.remarks || "");
        setErrors({});
      } catch (e) {
        setError("Failed to load vendor data");
      }
      setLoading(false);
    })();
  }, [vendorId]);



  const updateAddress = (which: "billing" | "shipping", field: keyof Address) => (val: string) => {
    if (which === "billing") setBilling(prev => ({ ...prev, [field]: val }));
    else setShipping(prev => ({ ...prev, [field]: val }));
  };

  function addContactPerson() {
    setContactPersons(prev => [...prev, { salutation: "", first_name: "", last_name: "", email: "", work_phone: "", mobile: "" }]);
  }

  function removeContactPerson(idx: number) {
    if (contact_persons.length <= 1) return;
    setContactPersons(prev => prev.filter((_, i) => i !== idx));
  }

  function updateContactPerson(idx: number, patch: Partial<ContactPerson>) {
    setContactPersons(prev => prev.map((cp, i) => (i === idx ? { ...cp, ...patch } : cp)));
  }

  function addCustomField() {
    setCustomFields(prev => [...prev, { key: "", value: "" }]);
  }

  function removeCustomField(idx: number) {
    if (custom_fields.length <= 1) return;
    setCustomFields(prev => prev.filter((_, i) => i !== idx));
  }

  function updateCustomField(idx: number, patch: Partial<{ key: string; value: string }>) {
    setCustomFields(prev => prev.map((cf, i) => (i === idx ? { ...cf, ...patch } : cf)));
  }

  function addTag() {
    const tag = newTag.trim();
    if (!tag) return;
    if (!tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setNewTag("");
    }
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!display_name.trim()) errs.display_name = "Display Name required";
    if (!email.trim()) errs.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Invalid email";
    contact_persons.forEach((cp, i) => {
      if (!cp.salutation) errs[`salutation_${i}`] = "Required";
      if (!cp.first_name.trim()) errs[`first_name_${i}`] = "Required";
      if (!cp.last_name.trim()) errs[`last_name_${i}`] = "Required";
      if (!cp.email.trim()) errs[`email_${i}`] = "Required";
      else if (!/\S+@\S+\.\S+/.test(cp.email)) errs[`email_${i}`] = "Invalid email";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function saveVendor() {
    if (!validate()) return;
    const payload = {
      vendor_type: vendorType,
      salutation,
      first_name,
      last_name,
      company_name,
      display_name,
      email,
      work_phone,
      mobile,
      pan,
      currency: currency.split(" ")[0],
      opening_balance,
      payment_terms,
      documents,
      billing_attention: billing.attention,
      billing_country: billing.country,
      billing_street1: billing.street1,
      billing_street2: billing.street2,
      billing_city: billing.city,
      billing_state: billing.state,
      billing_pin_code: billing.pin_code,
      billing_phone: billing.phone,
      billing_fax: billing.fax,
      shipping_attention: shipping.attention,
      shipping_country: shipping.country,
      shipping_street1: shipping.street1,
      shipping_street2: shipping.street2,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      shipping_pin_code: shipping.pin_code,
      shipping_phone: shipping.phone,
      shipping_fax: shipping.fax,
      contact_persons,
      custom_fields: custom_fields.reduce((acc, cf) => {
        if (cf.key.trim()) acc[cf.key.trim()] = cf.value.trim();
        return acc;
      }, {} as Record<string, string>),
      tags,
      remarks,
    };
    try {
      const res = await fetchWithAuth(`https://web-production-6baf3.up.railway.app/api/vendors/${vendorId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert("Failed to save vendor: " + JSON.stringify(err));
        return;
      }
      router.push("/books/purchase/vendors");
    } catch (e) {
      alert("Network error, please try again.");
      console.error(e);
    }
  }

  if (loading) return <div className="p-4">Loading vendor data...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen p-6 bg-green-50 sm:p-8">
      <div className="max-w-6xl p-6 mx-auto bg-white border border-green-200 rounded-lg shadow">
        <h1 className="mb-6 text-2xl font-semibold text-green-700">Edit Vendor</h1>

        {/* Vendor Type */}
        <div className="mb-5">
          <label className="block mb-2 font-medium text-green-800">Vendor Type</label>
          <div className="flex gap-8">
            <label className="flex items-center gap-2 text-green-800">
              <input type="radio" className="text-green-600" checked={vendorType === "business"} onChange={() => setVendorType("business")} />
              Business
            </label>
            <label className="flex items-center gap-2 text-green-800">
              <input type="radio" className="text-green-600" checked={vendorType === "individual"} onChange={() => setVendorType("individual")} />
              Individual
            </label>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
          <div>
            <label className="block mb-1 font-medium text-green-800">Salutation</label>
            <select className={inputBase} value={salutation} onChange={e => setSalutation(e.target.value as typeof salutation)}>
              <option value="">Select</option>
              <option value="dr">Dr</option>
              <option value="mr">Mr</option>
              <option value="ms">Ms</option>
              <option value="mrs">Mrs</option>
            </select>
            {errors.salutation_0 && (<p className="mt-1 text-xs text-red-600">{errors.salutation_0}</p>)}
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">First Name</label>
            <input className={inputBase} type="text" value={first_name} onChange={e => setFirstName(e.target.value)} />
            {errors.first_name_0 && (<p className="mt-1 text-xs text-red-600">{errors.first_name_0}</p>)}
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">Last Name</label>
            <input className={inputBase} type="text" value={last_name} onChange={e => setLastName(e.target.value)} />
            {errors.last_name_0 && (<p className="mt-1 text-xs text-red-600">{errors.last_name_0}</p>)}
          </div>
        </div>

        {/* Company & Display Name */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
          <div>
            <label className="block mb-1 font-medium text-green-800">Company Name</label>
            <input className={inputBase} value={company_name} onChange={e => setCompanyName(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">Display Name <span className="text-red-600">*</span></label>
            <input className={inputBase} value={display_name} onChange={e => setDisplayName(e.target.value)} />
            {errors.display_name && (<p className="mt-1 text-xs text-red-600">{errors.display_name}</p>)}
          </div>
        </div>

        {/* Email and Phones */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
          <div>
            <label className="block mb-1 font-medium text-green-800">Email</label>
            <input className={inputBase} type="email" value={email} onChange={e => setEmail(e.target.value)} />
            {errors.email && (<p className="mt-1 text-xs text-red-600">{errors.email}</p>)}
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">Work Phone</label>
            <input className={inputBase} type="tel" value={work_phone} onChange={e => setWorkPhone(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">Mobile</label>
            <input className={inputBase} type="tel" value={mobile} onChange={e => setMobile(e.target.value)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          {[
            "Other Details",
            "Address",
            "Contact Persons",
            "Custom Fields",
            "Reporting Tags",
            "Remarks",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as TabKey)}
              className={`mr-6 py-2 text-sm font-medium ${
                activeTab === tab
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        {activeTab === "Other Details" && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block mb-1 font-medium text-green-800">Tax ID</label>
              <input
                className={inputBase}
                value={pan}
                onChange={(e) => setPan(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-green-800">Currency</label>
              <select
                className={inputBase}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                className="mt-2 text-sm text-green-600 underline"
                onClick={() => setCurrency("INR - Indian Rupee")}
                type="button"
              >
                Reset to INR
              </button>
            </div>
            <div>
              <label className="block mb-1 font-medium text-green-800">
                Opening Balance
              </label>
              <div className="flex gap-2 items-center">
                <input
                  className={inputBase}
                  value={(currency.split(" ")[0] || "INR").toUpperCase()}
                  readOnly
                />
                <input
                  className={inputBase}
                  type="number"
                  value={opening_balance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium text-green-800">Payment Terms</label>
              <select
                className={inputBase}
                value={payment_terms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                {PAYMENT_TERMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-green-800">Documents</label>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-green-700 border border-green-300 rounded-md px-3 py-2 hover:bg-green-50">
                  <FaUpload />
                  <span>Upload Files</span>
                  <input
                    type="file"
                    accept="*"
                    hidden
                    onChange={onDocSelected}
                    multiple
                  />
                </label>
              </div>
              {documents.length === 0 ? (
                <p className="mt-2 text-green-600">No documents uploaded</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {documents.map((doc, i) => (
                    <li key={i} className="flex justify-between items-center border border-gray-300 p-2 rounded">
                      <span>
                        {doc.name} ({Math.round(doc.size / 1024)} KB)
                      </span>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => removeDoc(i)}
                        title="Remove document"
                      >
                        <FaTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === "Address" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
            {/* Billing Address */}
            <div>
              <h3 className="font-semibold mb-3">Billing Address</h3>
              {[
                ["Attention", billing.attention],
                ["Country", billing.country],
                ["Street 1", billing.street1],
                ["Street 2", billing.street2],
                ["City", billing.city],
                ["State", billing.state],
                ["Pin Code", billing.pin_code],
                ["Phone", billing.phone],
                ["Fax", billing.fax],
              ].map(([label, value], idx) => (
                <div key={idx} className="mb-3">
                  <label className="block mb-1 font-medium">{label}</label>
                  <input
                    className={inputBase}
                    value={value}
                    onChange={(e) => updateAddress("billing", label.toLowerCase().replace(/ /g, "_") as keyof Address)(e.target.value)}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShipping({ ...billing })}
                className="mt-2 text-sm underline text-green-600"
              >
                Copy to Shipping Address
              </button>
            </div>
            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold mb-3">Shipping Address</h3>
              {[
                ["Attention", shipping.attention],
                ["Country", shipping.country],
                ["Street 1", shipping.street1],
                ["Street 2", shipping.street2],
                ["City", shipping.city],
                ["State", shipping.state],
                ["Pin Code", shipping.pin_code],
                ["Phone", shipping.phone],
                ["Fax", shipping.fax],
              ].map(([label, value], idx) => (
                <div key={idx} className="mb-3">
                  <label className="block mb-1 font-medium">{label}</label>
                  <input
                    className={inputBase}
                    value={value}
                    onChange={(e) => updateAddress("shipping", label.toLowerCase().replace(/ /g, "_") as keyof Address)(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Contact Persons" && (
          <div className="mb-6">
            {contact_persons.length === 0 ? (
              <p>No contact persons added.</p>
            ) : (
              <table className="w-full border border-gray-300 rounded mb-3">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="p-2">Salutation</th>
                    <th className="p-2">First Name</th>
                    <th className="p-2">Last Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Work Phone</th>
                    <th className="p-2">Mobile</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contact_persons.map((cp, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="p-2">
                        <select
                          className={inputBase}
                          value={cp.salutation}
                          onChange={(e) =>
                            updateContactPerson(idx, {
                              salutation: e.target.value as ContactPerson["salutation"],
                            })
                          }
                        >
                          <option value="">Select</option>
                          <option value="dr">Dr</option>
                          <option value="mr">Mr</option>
                          <option value="ms">Ms</option>
                          <option value="mrs">Mrs</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          className={inputBase}
                          value={cp.first_name}
                          onChange={(e) =>
                            updateContactPerson(idx, { first_name: e.target.value })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className={inputBase}
                          value={cp.last_name}
                          onChange={(e) =>
                            updateContactPerson(idx, { last_name: e.target.value })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="email"
                          className={inputBase}
                          value={cp.email}
                          onChange={(e) =>
                            updateContactPerson(idx, { email: e.target.value })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className={inputBase}
                          value={cp.work_phone}
                          onChange={(e) =>
                            updateContactPerson(idx, { work_phone: e.target.value })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className={inputBase}
                          value={cp.mobile}
                          onChange={(e) =>
                            updateContactPerson(idx, { mobile: e.target.value })
                          }
                        />
                      </td>
                      <td className="p-2 text-right">
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => removeContactPerson(idx)}
                          disabled={contact_persons.length === 1}
                          title="Remove"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              type="button"
              onClick={addContactPerson}
              className="inline-flex items-center gap-2 px-3 py-2 text-green-700 border border-green-300 rounded-md hover:bg-green-50"
            >
              <FaPlus /> Add Contact Person
            </button>
          </div>
        )}

        {activeTab === "Custom Fields" && (
          <div className="mb-6">
            {custom_fields.length === 0 && <p>No custom fields added.</p>}
            {custom_fields.length > 0 && (
              <>
                {custom_fields.map((cf, idx) => (
                  <div
                    className="grid grid-cols-3 gap-3 mb-2 items-center"
                    key={idx}
                  >
                    <input
                      className={`${inputBase} col-span-1`}
                      placeholder="Field name"
                      value={cf.key}
                      onChange={(e) =>
                        updateCustomField(idx, { key: e.target.value })
                      }
                    />
                    <input
                      className={`${inputBase} col-span-1`}
                      placeholder="Value"
                      value={cf.value}
                      onChange={(e) =>
                        updateCustomField(idx, { value: e.target.value })
                      }
                    />
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => removeCustomField(idx)}
                      disabled={custom_fields.length === 1}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="inline-flex items-center gap-2 mt-3 text-green-700 border border-green-300 rounded-md px-3 py-2 hover:bg-green-50"
                  onClick={addCustomField}
                >
                  <FaPlus /> Add Custom Field
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === "Reporting Tags" && (
          <div className="mb-6">
            <div className="flex gap-2 mb-2">
              <input
                className={inputBase}
                placeholder="Enter tag and press Add"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
              <button
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                onClick={addTag}
                type="button"
              >
                Add
              </button>
            </div>
            {tags.length === 0 ? (
              <p className="italic text-gray-600">No tags added</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-3 py-1"
                  >
                    {tag}
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => removeTag(tag)}
                      title="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Remarks" && (
          <div className="mb-6">
            <label className="block mb-1 font-medium">Remarks</label>
            <textarea
              className="w-full border border-green-300 rounded-md p-2"
              rows={5}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any remarks here"
            />
          </div>
        )}

        {/* Save & Cancel Buttons */}
        <div className="sticky bottom-0 bg-white flex justify-end gap-3 p-4 border-t border-green-200">
          <button
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            onClick={saveVendor}
          >
            Save Vendor
          </button>
          <button
            className="border border-green-600 text-green-600 px-6 py-2 rounded-md hover:bg-green-50"
            onClick={() => router.push("/books/purchase/vendors")}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}