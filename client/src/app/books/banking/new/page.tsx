"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchWithAuth } from "@/auth/tokenservice";

export default function AddBankPage() {
  const router = useRouter();

  const [accountName, setAccountName] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [description, setDescription] = useState("");
  const [openingBalance, setOpeningBalance] = useState<number | "">("");
  const [primary, setPrimary] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!accountName.trim()) {
      setError("Please enter Account Name");
      return;
    }
    if (!currency) {
      setError("Please select Currency");
      return;
    }
    if (openingBalance === "" || openingBalance === null) {
      setError("Opening balance is required.");
      return;
    }

    const payload = {
      account_type: "bank",
      account_name: accountName,
      account_code: accountCode,
      currency,
      account_number: accountNumber,
      bank_name: bankName,
      ifsc,
      opening_balance: Number(openingBalance),
      description,
      notes: "",
      primary,
      current_balance: null, // backend calculates this
    };

    try {
      setLoading(true);
      const res = await fetchWithAuth("https://web-production-6baf3.up.railway.app/api/banking/banking-accounts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization header handled inside fetchWithAuth
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(JSON.stringify(data, null, 2));
        setLoading(false);
        return;
      }

      alert("Account added successfully");
      router.push("/banking"); // Redirect back to banking list page
    } catch (err) {
      setError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 700 }}>
        <h2 className="title" style={{ fontSize: 22, marginBottom: 20 }}>
          Add Bank Account
        </h2>
        <form className="form" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="accountName">Account Name*</label>
            <input
              id="accountName"
              className="control"
              type="text"
              placeholder="Enter account name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="accountCode">Account Code</label>
            <input
              id="accountCode"
              className="control"
              type="text"
              placeholder="Enter account code"
              value={accountCode}
              onChange={(e) => setAccountCode(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="currency">Currency*</label>
            <select
              id="currency"
              className="select"
              aria-label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="accountNumber">Account Number</label>
            <input
              id="accountNumber"
              className="control"
              type="text"
              placeholder="Enter account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="bankName">Bank Name</label>
            <input
              id="bankName"
              className="control"
              type="text"
              placeholder="Enter bank name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="ifsc">IFSC</label>
            <input
              id="ifsc"
              className="control"
              type="text"
              placeholder="Enter IFSC code"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="openingBalance">Opening Balance*</label>
            <input
              id="openingBalance"
              className="control"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter opening balance"
              value={openingBalance}
              onChange={(e) =>
                setOpeningBalance(e.target.value === "" ? "" : Number(e.target.value))
              }
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="textarea"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={primary}
              onChange={(e) => setPrimary(e.target.checked)}
              id="primaryAccount"
            />
            <label htmlFor="primaryAccount">Make this primary</label>
          </div>
          {error && <p style={{ color: "red", marginTop: 4, whiteSpace: "pre-wrap" }}>{error}</p>}
          <div className="row" style={{ gap: 12, marginTop: 12 }}>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => router.push("/books/banking")}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Include your global styles here or import as needed */}
      <style jsx global>{`
        :root {
          --g-50: #f2fbf3;
          --g-100: #e0f5e2;
          --g-200: #c7eccb;
          --g-300: #9fdfab;
          --g-400: #6fcd82;
          --g-500: #38b36e;
          --g-600: #2d9b5c;
          --g-700: #237a49;
          --g-800: #1b5c38;
          --g-900: #133f27;
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--g-50); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #102a13; }
        .page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
        .card { width: 100%; max-width: 980px; background: #fff; border: 1px solid var(--g-200); border-radius: 16px; box-shadow: 0 10px 30px rgba(12, 68, 28, 0.08); padding: 28px; }
        .title { margin: 0 0 8px; color: var(--g-700); font-weight: 800; }
        .muted { color: #4b5b4f; }
        .row { display: flex; gap: 12px; align-items: center; }
        .btn { appearance: none; border: none; background: var(--g-600); color: #fff; padding: 12px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: transform .02s ease, box-shadow .2s ease, background .2s ease; box-shadow: 0 6px 14px rgba(14, 92, 42, 0.2); }
        .btn:hover { background: var(--g-700); }
        .btn:active { transform: translateY(1px); }
        .btn-ghost { background: var(--g-200); color: #0f2a12; box-shadow: none; }
        .btn-ghost:hover { background: var(--g-300); }
        .form { display: grid; gap: 16px; max-width: 640px; }
        .label { font-weight: 600; color: var(--g-700); margin-bottom: 6px; display: inline-block; }
        .control, .select, .textarea { width: 100%; border: 1px solid var(--g-300); border-radius: 10px; padding: 10px 12px; font-size: 14px; outline: none; transition: border-color .2s, box-shadow .2s; background: #fff; }
        .textarea { min-height: 96px; resize: vertical; }
        .control:focus, .select:focus, .textarea:focus { border-color: var(--g-500); box-shadow: 0 0 0 3px rgba(56, 179, 110, 0.2); }
        .radio-row { display: flex; gap: 18px; align-items: center; }
        .hint { font-size: 12px; color: #5a6d5f; }
        @media (max-width: 900px) {
          .form { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}
