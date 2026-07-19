"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Business = {
  business_name: string;
  category: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  has_website: boolean;
};

const CATEGORY_OPTIONS = [
  { value: "restaurants", label: "Restaurants" },
  { value: "cafes", label: "Cafes" },
  { value: "salons", label: "Salons / Beauty" },
  { value: "mechanics", label: "Mechanics / Auto" },
  { value: "clinics", label: "Clinics" },
  { value: "pharmacies", label: "Pharmacies" },
  { value: "hotels", label: "Hotels" },
  { value: "retail_shops", label: "Retail Shops" },
  { value: "law_firms", label: "Law Firms" },
  { value: "real_estate", label: "Real Estate" },
];

export default function DiscoverPanel() {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("restaurants");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Business[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResults([]);
    setSelected(new Set());

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, category }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Search failed.");
      } else {
        setResults(data.businesses);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAllNoSite() {
    const noSiteIndexes = results
      .map((b, i) => (!b.has_website ? i : null))
      .filter((i) => i !== null) as number[];
    setSelected(new Set(noSiteIndexes));
  }

  async function addSelected() {
    setAdding(true);
    const toAdd = Array.from(selected).map((i) => {
      const b = results[i];
      return {
        business_name: b.business_name,
        category: b.category,
        address: b.address,
        phone: b.phone,
        email: b.email,
        website_url: b.website_url,
        has_website: b.has_website,
      };
    });

    const { error } = await supabase.from("leads").insert(toAdd);
    setAdding(false);

    if (!error) {
      setResults([]);
      setSelected(new Set());
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div style={{ marginBottom: "24px" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "var(--char-900)",
          border: "1px solid var(--ember)",
          color: "var(--ember)",
          borderRadius: "4px",
          padding: "9px 16px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: open ? "16px" : 0,
        }}
      >
        {open ? "Close discovery" : "⌕ Discover leads"}
      </button>

      {open && (
        <div
          style={{
            background: "var(--char-900)",
            border: "1px solid var(--char-700)",
            borderRadius: "6px",
            padding: "16px",
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.4fr auto",
              gap: "10px",
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>Location</label>
              <input
                required
                placeholder="e.g. Ilorin, Nigeria"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "var(--ember)",
                color: "var(--char-950)",
                border: "none",
                borderRadius: "4px",
                padding: "10px 18px",
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                height: "38px",
              }}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </form>

          {error && (
            <p style={{ color: "#ff9d80", fontSize: "13px", marginTop: "12px" }}>
              {error}
            </p>
          )}

          {results.length > 0 && (
            <div style={{ marginTop: "18px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--steel-300)" }}>
                  {results.length} found · {results.filter((r) => !r.has_website).length} with no website
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={selectAllNoSite} style={smallBtnStyle}>
                    Select all with no site
                  </button>
                  <button
                    onClick={addSelected}
                    disabled={selected.size === 0 || adding}
                    style={{
                      ...smallBtnStyle,
                      background: "var(--ember)",
                      color: "var(--char-950)",
                      borderColor: "var(--ember)",
                      fontWeight: 600,
                    }}
                  >
                    {adding ? "Adding…" : `Add ${selected.size} to leads`}
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                {results.map((b, i) => (
                  <label
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px",
                      borderBottom: "1px solid var(--char-800)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggleSelect(i)}
                      style={{ marginTop: "3px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600 }}>
                        {b.business_name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--steel-300)" }}>
                        {b.address ?? "No address listed"}
                        {b.phone ? ` · ${b.phone}` : ""}
                        {b.email ? ` · ${b.email}` : ""}
                      </div>
                      {!b.phone && !b.email && (
                        <div style={{ fontSize: "11px", color: "var(--char-500)", marginTop: "2px" }}>
                          No contact info listed ·{" "}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${b.business_name} ${b.address ?? ""}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: "var(--ember)", textDecoration: "underline" }}
                          >
                            look up on Maps
                          </a>
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: b.has_website ? "var(--ok)" : "var(--warn)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.has_website ? "has site" : "no site"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "var(--steel-300)",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "var(--char-950)",
  border: "1px solid var(--char-700)",
  borderRadius: "4px",
  color: "var(--steel-100)",
  fontSize: "13px",
};

const smallBtnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--char-700)",
  color: "var(--steel-300)",
  borderRadius: "4px",
  padding: "7px 12px",
  fontSize: "12px",
  cursor: "pointer",
};