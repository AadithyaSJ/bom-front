"use client";

import { useRouter } from "next/navigation";
import { useState, ChangeEvent } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUpload,
  FaInfoCircle,
  FaMoneyBill,
  FaTag,
  FaTrash,
  FaCopy,
  FaPlus,
} from "react-icons/fa";

type CustomerType = "Business" | "Individual";
type TabKey =
  | "Other Details"
  | "Address"
  | "Contact Persons"
  | "Custom Fields"
  | "Reporting Tags"
  | "Remarks";

type ContactPerson = {
  salutation: string;
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
  pinCode: string;
  phone: string;
  fax: string;
};

type FileMeta = { name: string; size: number; type: string };

type CustomField = { key: string; value: string };

const CURRENCY_OPTIONS = [
  "AED - UAE Dirham",
  "AUD - Australian Dollar",
  "BND - Brunei Dollar",
  "CAD - Canadian Dollar",
  "CNY - Yuan Renminbi",
  "EUR - Euro",
  "GBP - Pound Sterling",
  "INR - Indian Rupee",
  "JPY - Japanese Yen",
  "SAR - Saudi Riyal",
  "USD - United States Dollar",
  "ZAR - South African Rand",
];

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry"
];

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Australia", "Canada", "Singapore", "Germany"
];


const PAYMENT_TERMS = ["Due on Receipt", "Net 7", "Net 15", "Net 30", "Net 45"];

const SALUTATION_MAP: Record<string, string> = {
  Dr: "dr",
  Mr: "mr",
  Ms: "ms",
  Mrs: "mrs",
};

export default function NewCustomerPage() {
  const router = useRouter();

  // ----- Global UI helpers -----
  const inputBase =
    "w-full rounded-md border border-green-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500";
  const withIcon =
    "flex items-center rounded-md border border-green-300 px-3 focus-within:ring-2 focus-within:ring-green-500";

  // ----- Primary / Header state -----
  const [customerType, setCustomerType] = useState<CustomerType>("Business");

  const [salutation, setSalutation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [email, setEmail] = useState("");
  const [workPhone, setWorkPhone] = useState("");
  const [mobile, setMobile] = useState("");

  // ----- Other Details -----
  const [pan, setPan] = useState("");
  const [currency, setCurrency] = useState("INR - Indian Rupee");
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState("Due on Receipt");
  const [documents, setDocuments] = useState<File[]>([]);

  // ----- Address -----
  const [billing, setBilling] = useState<Address>({
    attention: "",
    country: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    pinCode: "",
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
    pinCode: "",
    phone: "",
    fax: "",
  });

  // ----- Contact Persons -----
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([
    {
      salutation: "",
      first_name: "",
      last_name: "",
      email: "",
      work_phone: "",
      mobile: "",
    },
  ]);

  // ----- Custom Fields -----
  const [customFields, setCustomFields] = useState<CustomField[]>([
    { key: "", value: "" },
  ]);

  // ----- Reporting Tags -----
  const [reportingTags, setReportingTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // ----- Remarks -----
  const [remarks, setRemarks] = useState("");

  // ----- Tabs & validation -----
  const [activeTab, setActiveTab] = useState<TabKey>("Other Details");
  const [errors, setErrors] = useState<{ displayName?: string; email?: string }>(
    {}
  );

  // =================== Handlers ===================

  function onDocsSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const withinLimit = files
      .filter((f) => f.size <= 10 * 1024 * 1024)
      .slice(0, 10);
    setDocuments((prev) => [...prev, ...withinLimit].slice(0, 10));
    e.target.value = "";
  }

  async function uploadFile(file: File, token: string) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://web-production-6baf3.up.railway.app/api/files/", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) throw new Error("File upload failed");
    return await res.json(); // { id, file }
  }


  const removeDoc = (idx: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const copyBillingToShipping = () => {
    setShipping({ ...billing });
  };

  const updateAddress =
    (which: "billing" | "shipping", field: keyof Address) =>
    (val: string) => {
      if (which === "billing") setBilling((a) => ({ ...a, [field]: val }));
      else setShipping((a) => ({ ...a, [field]: val }));
    };

  function addCP() {
    setContactPersons((arr) => [
      ...arr,
      {
        salutation: "",
        first_name: "",
        last_name: "",
        email: "",
        work_phone: "",
        mobile: "",
      },
    ]);
  }

  function removeCP(index: number) {
    setContactPersons((arr) => arr.filter((_, i) => i !== index));
  }

  function updateCP(index: number, patch: Partial<ContactPerson>) {
    setContactPersons((arr) =>
      arr.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function addCustomField() {
    setCustomFields((arr) => [...arr, { key: "", value: "" }]);
  }

  function removeCustomField(i: number) {
    setCustomFields((arr) => arr.filter((_, idx) => idx !== i));
  }

  function updateCustomField(i: number, patch: Partial<CustomField>) {
    setCustomFields((arr) =>
      arr.map((row, idx) => (idx === i ? { ...row, ...patch } : row))
    );
  }

  function addTag() {
    const t = newTag.trim();
    if (!t) return;
    if (!reportingTags.includes(t)) setReportingTags((arr) => [...arr, t]);
    setNewTag("");
  }

  function removeTag(t: string) {
    setReportingTags((arr) => arr.filter((x) => x !== t));
  }

  function validate() {
    const next: typeof errors = {};
    if (!displayName.trim()) next.displayName = "Display Name is required";
    if (!email.trim()) next.email = "Email is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function saveCustomer() {
    try {
      const token = localStorage.getItem("accessToken")!;
      if (!token) {
        alert("No token found. Please login.");
        return;
      }

      const uploadedDocs = await Promise.all(
        documents.map((file) => uploadFile(file, token))
      );
      const fileIds = uploadedDocs.map((d) => d.id);

    if (!validate()) return;

    const mappedContactPersons = contactPersons.map((cp) => ({
        salutation: SALUTATION_MAP[cp.salutation.trim()] || "",
        first_name: cp.first_name.trim(),
        last_name: cp.last_name.trim(),
        email: cp.email.trim(),
        work_phone: cp.work_phone.trim(),
        mobile: cp.mobile.trim(),
      }));

    // payload matching backend API fields exactly
    const payload = {
      customer_type: customerType.toLowerCase(), // "business" or "individual"
      salutation: SALUTATION_MAP[salutation.trim()] || "",
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      company_name: companyName.trim(),
      display_name: displayName.trim(),
      email: email.trim(),
      work_phone: workPhone.trim(),
      mobile: mobile.trim(),
      pan: pan.trim(),
      currency: currency.split(" - ")[0], // e.g. "INR"
      opening_balance: openingBalance.toFixed(2), // string with two decimals
      payment_terms: paymentTerms.toLowerCase().replace(/\s/g, "_"), // e.g. "net_30"
      file_ids: fileIds,
      billing_attention: billing.attention.trim(),
      billing_country: billing.country.trim(),
      billing_street1: billing.street1.trim(),
      billing_street2: billing.street2.trim(),
      billing_city: billing.city.trim(),
      billing_state: billing.state.trim(),
      billing_pin_code: billing.pinCode.trim(),
      billing_phone: billing.phone.trim(),
      billing_fax: billing.fax.trim(),
      shipping_attention: shipping.attention.trim(),
      shipping_country: shipping.country.trim(),
      shipping_street1: shipping.street1.trim(),
      shipping_street2: shipping.street2.trim(),
      shipping_city: shipping.city.trim(),
      shipping_state: shipping.state.trim(),
      shipping_pin_code: shipping.pinCode.trim(),
      shipping_phone: shipping.phone.trim(),
      shipping_fax: shipping.fax.trim(),
      contact_persons:mappedContactPersons,
      custom_fields: Object.fromEntries(
        customFields
          .filter((cf) => cf.key.trim())
          .map((cf) => [cf.key.trim(), cf.value.trim()])
      ),
      tags: reportingTags,
      remarks: remarks.trim(),
    };

      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/customers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Backend validation error:", errorData);
        alert("Failed to save customer: " + (errorData.detail || JSON.stringify(errorData)));
        return;
      }
      router.push("/books/sales/customers");
    } catch (err) {
      alert("Error saving customer.");
      console.error(err);
    }
  }

  // =================== UI ===================
  return (
    <div className="min-h-screen p-6 bg-green-50 sm:p-8">
      <div className="max-w-6xl p-6 mx-auto bg-white border border-green-200 rounded-lg shadow">
        {/* Header */}
        <h1 className="mb-6 text-2xl font-semibold text-green-700">New Customer</h1>

        {/* Customer Type */}
        <div className="mb-5">
          <label className="block mb-2 font-medium text-green-800">
            Customer Type
          </label>
          <div className="flex gap-8">
            <label className="flex items-center gap-2 text-green-800">
              <input
                type="radio"
                className="text-green-600 focus:ring-green-600"
                checked={customerType === "Business"}
                onChange={() => setCustomerType("Business")}
              />
              Business
            </label>
            <label className="flex items-center gap-2 text-green-800">
              <input
                type="radio"
                className="text-green-600 focus:ring-green-600"
                checked={customerType === "Individual"}
                onChange={() => setCustomerType("Individual")}
              />
              Individual
            </label>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-1 font-medium text-green-800">Salutation</label>
            <select
              className={inputBase}
              value={salutation}
              onChange={(e) => setSalutation(e.target.value)}
            >
              <option value="">Select</option>
              <option>Dr</option>
              <option>Mr</option>
              <option>Ms</option>
              <option>Mrs</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">First Name</label>
            <div className={withIcon}>
              <FaUser className="mr-2 text-green-500" />
              <input
                type="text"
                className="w-full py-2 outline-none"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">Last Name</label>
            <input
              type="text"
              className={inputBase}
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 font-medium text-green-800">Company Name</label>
            <input
              type="text"
              className={inputBase}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-green-800">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              className={inputBase}
              placeholder="Select or type to add"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 font-medium text-green-800">Email Address</label>
            <div className={withIcon}>
              <FaEnvelope className="mr-2 text-green-500" />
              <input
                type="email"
                className="w-full py-2 outline-none"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block mb-1 font-medium text-green-800">Work Phone</label>
              <div className={withIcon}>
                <FaPhone className="mr-2 text-green-500" />
                <input
                  type="tel"
                  className="w-full py-2 outline-none"
                  placeholder="Work Phone"
                  value={workPhone}
                  onChange={(e) => setWorkPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium text-green-800">Mobile</label>
              <div className={withIcon}>
                <FaPhone className="mr-2 text-green-500" />
                <input
                  type="tel"
                  className="w-full py-2 outline-none"
                  placeholder="Mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-green-200">
          {[
            "Other Details",
            "Address",
            "Contact Persons",
            "Custom Fields",
            "Reporting Tags",
            "Remarks",
          ].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as TabKey)}
              className={`mr-6 border-b-2 py-2 text-sm ${
                activeTab === t
                  ? "border-green-600 text-green-700"
                  : "border-transparent text-green-600 hover:text-green-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* =========== OTHER DETAILS TAB =========== */}
        {activeTab === "Other Details" && (
          <div className="mt-5 space-y-4">
            {/* PAN */}
            <div>
              <label className="block mb-1 font-medium text-green-800">PAN</label>
              <input
                type="text"
                className={inputBase}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block mb-1 font-medium text-green-800">Currency</label>
              <select
                className={inputBase}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                className="mt-2 text-sm font-medium text-green-600 hover:underline"
                onClick={() => setCurrency("INR - Indian Rupee")}
                title="Reset to INR"
              >
                Reset to INR
              </button>
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block mb-1 font-medium text-green-800">
                Opening Balance
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="w-24 px-2 py-2 text-center text-green-700 border border-green-300 rounded-md bg-green-50"
                  value={(currency.split(" - ")[0] || "INR").toUpperCase()}
                  readOnly
                />
                <input
                  type="number"
                  className={inputBase}
                  placeholder="0.00"
                  value={Number.isFinite(openingBalance) ? openingBalance : 0}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block mb-1 font-medium text-green-800">
                Payment Terms
              </label>
              <select
                className={inputBase}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              >
                {PAYMENT_TERMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Documents */}
            <div>
              <label className="block mb-1 font-medium text-green-800">Documents</label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 text-green-700 border border-green-300 rounded-md cursor-pointer hover:bg-green-50">
                  <FaUpload />
                  <span>Upload File</span>
                  <input type="file" multiple className="hidden" onChange={onDocsSelected} />
                </label>
                <button
                  type="button"
                  className="px-2 py-2 text-green-700 border border-green-300 rounded-md"
                  title="More"
                >
                  ▾
                </button>
              </div>
              <p className="mt-1 text-sm text-green-600">
                You can upload a maximum of 10 files, 10MB each (stored as metadata only).
              </p>

              {documents.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {documents.map((d, i) => (
                    <li
                      key={`${d.name}-${i}`}
                      className="flex items-center justify-between px-3 py-2 border border-green-200 rounded-md"
                    >
                      <span className="truncate">
                        {d.name} <span className="text-xs text-green-700">({Math.ceil(d.size / 1024)} KB)</span>
                      </span>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => removeDoc(i)}
                        title="Remove"
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

        {/* =========== ADDRESS TAB =========== */}
{activeTab === "Address" && (
  <div className="grid grid-cols-1 gap-10 mt-6 md:grid-cols-2">
    {/* Billing Address */}
    <div>
      <h3 className="mb-4 text-lg font-semibold text-green-700">
        Billing Address
      </h3>
      {/* Country/Region */}
      <div className="mb-3">
        <label className="block mb-1 font-medium text-green-800">Country/Region</label>
        <select
          className={inputBase}
          value={billing.country}
          onChange={e => updateAddress("billing", "country")(e.target.value)}
        >
          <option value="">Select</option>
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>
      {/* State */}
      <div className="mb-3">
        <label className="block mb-1 font-medium text-green-800">State</label>
        <select
          className={inputBase}
          value={billing.state}
          onChange={e => updateAddress("billing", "state")(e.target.value)}
        >
          <option value="">Select</option>
          {STATES.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>
      {[
        { label: "Attention", field: "attention" as keyof Address },
        { label: "Street 1", field: "street1" as keyof Address },
        { label: "Street 2", field: "street2" as keyof Address },
        { label: "City", field: "city" as keyof Address },
        { label: "Pin Code", field: "pinCode" as keyof Address },
        { label: "Phone", field: "phone" as keyof Address },
        { label: "Fax Number", field: "fax" as keyof Address },
      ].map((row) => (
        <div className="mb-3" key={`bill-${row.field}`}>
          <label className="block mb-1 font-medium text-green-800">{row.label}</label>
          <input
            type="text"
            className={inputBase}
            placeholder={row.label}
            value={billing[row.field]}
            onChange={e => updateAddress("billing", row.field)(e.target.value)}
          />
        </div>
      ))}
    </div>

    {/* Shipping Address */}
    <div>
      <h3 className="mb-4 text-lg font-semibold text-green-700">
        Shipping Address{" "}
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:underline"
          onClick={copyBillingToShipping}
        >
          <FaCopy /> ( Copy billing address )
        </button>
      </h3>
      {/* Country/Region */}
      <div className="mb-3">
        <label className="block mb-1 font-medium text-green-800">Country/Region</label>
        <select
          className={inputBase}
          value={shipping.country}
          onChange={e => updateAddress("shipping", "country")(e.target.value)}
        >
          <option value="">Select</option>
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>
      {/* State */}
      <div className="mb-3">
        <label className="block mb-1 font-medium text-green-800">State</label>
        <select
          className={inputBase}
          value={shipping.state}
          onChange={e => updateAddress("shipping", "state")(e.target.value)}
        >
          <option value="">Select</option>
          {STATES.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>
      {[
        { label: "Attention", field: "attention" as keyof Address },
        { label: "Street 1", field: "street1" as keyof Address },
        { label: "Street 2", field: "street2" as keyof Address },
        { label: "City", field: "city" as keyof Address },
        { label: "Pin Code", field: "pinCode" as keyof Address },
        { label: "Phone", field: "phone" as keyof Address },
        { label: "Fax Number", field: "fax" as keyof Address },
      ].map((row) => (
        <div className="mb-3" key={`ship-${row.field}`}>
          <label className="block mb-1 font-medium text-green-800">{row.label}</label>
          <input
            type="text"
            className={inputBase}
            placeholder={row.label}
            value={shipping[row.field]}
            onChange={e => updateAddress("shipping", row.field)(e.target.value)}
          />
        </div>
      ))}
    </div>
  </div>
)}


        {/* =========== CONTACT PERSONS TAB =========== */}
        {activeTab === "Contact Persons" && (
          <div className="mt-6">
            <div className="overflow-x-auto border border-green-200 rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="text-green-800 bg-green-50">
                  <tr>
                    <th className="px-3 py-2 font-medium">SALUTATION</th>
                    <th className="px-3 py-2 font-medium">FIRST NAME</th>
                    <th className="px-3 py-2 font-medium">LAST NAME</th>
                    <th className="px-3 py-2 font-medium">EMAIL ADDRESS</th>
                    <th className="px-3 py-2 font-medium">WORK PHONE</th>
                    <th className="px-3 py-2 font-medium">MOBILE</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {contactPersons.map((cp, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">
                        <select
                          className="w-full px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={cp.salutation}
                          onChange={(e) =>
                            updateCP(idx, { salutation: e.target.value })
                          }
                        >
                          <option value=""></option>
                          <option>Dr</option>
                          <option>Mr</option>
                          <option>Ms</option>
                          <option>Mrs</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="w-full px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={cp.first_name}
                          onChange={(e) =>
                            updateCP(idx, { first_name: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="w-full px-2 py-1 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={cp.last_name}
                          onChange={(e) =>
                            updateCP(idx, { last_name: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center px-2 border border-green-300 rounded focus-within:ring-2 focus-within:ring-green-500">
                          <FaEnvelope className="mr-2 text-green-500" />
                          <input
                            type="email"
                            className="w-full py-1 outline-none"
                            value={cp.email}
                            onChange={(e) => updateCP(idx, { email: e.target.value })}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center px-2 border border-green-300 rounded focus-within:ring-2 focus-within:ring-green-500">
                          <FaPhone className="mr-2 text-green-500" />
                          <input
                            className="w-full py-1 outline-none"
                            value={cp.work_phone}
                            onChange={(e) =>
                              updateCP(idx, { work_phone: e.target.value })
                            }
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center px-2 border border-green-300 rounded focus-within:ring-2 focus-within:ring-green-500">
                          <FaPhone className="mr-2 text-green-500" />
                          <input
                            className="w-full py-1 outline-none"
                            value={cp.mobile}
                            onChange={(e) => updateCP(idx, { mobile: e.target.value })}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeCP(idx)}
                          className="text-red-600 hover:underline"
                          title="Remove"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addCP}
              className="inline-flex items-center gap-2 px-3 py-2 mt-3 text-green-700 border border-green-300 rounded-md hover:bg-green-50"
            >
              <span className="rounded-full bg-green-600 px-2 py-0.5 text-white">
                +
              </span>
              Add Contact Person
            </button>
          </div>
        )}

        {/* =========== CUSTOM FIELDS TAB =========== */}
        {activeTab === "Custom Fields" && (
          <div className="mt-6">
            <p className="flex items-center gap-2 mb-3 text-sm text-green-700">
              <FaInfoCircle /> Add any additional data as key-value pairs.
            </p>
            <div className="space-y-3">
              {customFields.map((cf, idx) => (
                <div
                  key={idx}
                  className="grid items-center grid-cols-1 gap-3 md:grid-cols-[1fr,1fr,auto]"
                >
                  <input
                    className={inputBase}
                    placeholder="Field name (e.g., GST No.)"
                    value={cf.key}
                    onChange={(e) =>
                      updateCustomField(idx, { key: e.target.value })
                    }
                  />
                  <input
                    className={inputBase}
                    placeholder="Value"
                    value={cf.value}
                    onChange={(e) =>
                      updateCustomField(idx, { value: e.target.value })
                    }
                  />
                  <button
                    className="px-3 py-2 text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                    onClick={() => removeCustomField(idx)}
                    title="Remove field"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCustomField}
              className="inline-flex items-center gap-2 px-3 py-2 mt-4 text-green-700 border border-green-300 rounded-md hover:bg-green-50"
            >
              <FaPlus /> Add Field
            </button>
          </div>
        )}

        {/* =========== REPORTING TAGS TAB =========== */}
        {activeTab === "Reporting Tags" && (
          <div className="mt-6">
            <p className="flex items-center gap-2 mb-3 text-sm text-green-700">
              <FaTag /> Add tags to group/filter customers in reports.
            </p>
            <div className="flex gap-2">
              <input
                className={inputBase}
                placeholder="Enter tag and press Add"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
              />
              <button
                className="px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                onClick={addTag}
                type="button"
              >
                Add
              </button>
            </div>
            {reportingTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {reportingTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm border border-green-300 rounded-full"
                  >
                    {t}
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => removeTag(t)}
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

        {/* =========== REMARKS TAB =========== */}
        {activeTab === "Remarks" && (
          <div className="mt-6">
            <label className="block mb-1 font-medium text-green-800">
              Remarks (For Internal Use)
            </label>
            <textarea
              rows={4}
              className={inputBase}
              placeholder="Type here..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        )}

        {/* Footer buttons */}
        <div className="sticky bottom-0 flex justify-end gap-3 pt-4 mt-8 border-t border-green-100 bg-white">
          <button
            onClick={saveCustomer}
            className="px-6 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            Save Customer
          </button>
          <button
            onClick={() => router.push("/books/sales/customers")}
            className="px-6 py-2 font-medium text-green-700 border border-green-300 rounded-md hover:bg-green-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}