"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Lead = {
  id: string;
  business_name: string;
  category: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  has_website: boolean;
  site_score: number | null;
  status: "new" | "contacted" | "replied" | "closed";
  notes: string | null;
};

const STATUS_COLOR: Record<Lead["status"], string> = {
  new: "var(--ember)",
  contacted: "var(--warn)",
  replied: "var(--ok)",
  closed: "var(--char-500)",
};

export default function LeadsTable({
  initialLeads,
}: {
  initialLeads: Lead[];
}) {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    category: "",
    address: "",
    phone: "",
    website_url: "",
  });

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { data, error } = await supabase
      .from("leads")
      .insert({
        business_name: form.business_name,
        category: form.category || null,
        address: form.address || null,
        phone: form.phone || null,
        website_url: form.website_url || null,
        has_website: form.website_url.length > 0,
      })
      .select()
      .single();

    setSaving(false);

    if (!error && data) {
      setLeads((prev) => [data as Lead, ...prev]);
      setForm({
        business_name: "",
        category: "",
        address: "",
        phone: "",
        website_url: "",
      });
      setShowForm(false);
    }
  }

  async function updateStatus(id: string, status: Lead["status"]) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    );
    await supabase.from("leads").update({ status }).eq("id", id);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{
            background: "var(--ember)",
            color: "var(--char-950)",
            border: "none",
            borderRadius: "4px",
            padding: "9px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "+ Add lead"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={addLead}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            background: "var(--char-900)",
            border: "1px solid var(--char-700)",
            borderRadius: "6px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <input
            required
            placeholder="Business name"
            value={form.business_name}
            onChange={(e) =>
              setForm({ ...form, business_name: e.target.value })
            }
            style={inputStyle}
          />
          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={inputStyle}
          />
          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            style={inputStyle}
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={inputStyle}
          />
          <input
            placeholder="Website URL (leave blank if none)"
            value={form.website_url}
            onChange={(e) =>
              setForm({ ...form, website_url: e.target.value })
            }
            style={{ ...inputStyle, gridColumn: "1 / -1" }}
          />
          <button
            type="submit"
            disabled={saving}
            style={{
              gridColumn: "1 / -1",
              background: "var(--ember)",
              color: "var(--char-950)",
              border: "none",
              borderRadius: "4px",
              padding: "10px",
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save lead"}
          </button>
        </form>
      )}

      {leads.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--char-700)",
            borderRadius: "6px",
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--steel-300)",
          }}
        >
          No leads yet. Add your first one above.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: "11px", color: "var(--steel-300)" }}>
                <th style={thStyle}>Business</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Site</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} style={{ borderTop: "1px solid var(--char-800)" }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{lead.business_name}</div>
                    {(lead.phone || lead.email) ? (
                      <div style={{ fontSize: "12px", color: "var(--steel-300)" }}>
                        {lead.phone}
                        {lead.phone && lead.email ? " · " : ""}
                        {lead.email}
                      </div>
                    ) : (
                      <div style={{ fontSize: "11px", color: "var(--warn)" }}>
                        no contact info ·{" "}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${lead.business_name} ${lead.address ?? ""}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--ember)", textDecoration: "underline" }}
                        >
                          look up on Maps
                        </a>
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>{lead.category ?? "—"}</td>
                  <td style={tdStyle}>
                    {lead.has_website ? (
                      <a href={lead.website_url ?? "#"} target="_blank" rel="noreferrer" style={{ color: "var(--ember)" }}>
                        visit ↗
                      </a>
                    ) : (
                      <span style={{ color: "var(--warn)" }}>no site</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {lead.site_score ?? "—"}
                  </td>
                  <td style={tdStyle}>
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        updateStatus(lead.id, e.target.value as Lead["status"])
                      }
                      style={{
                        background: "var(--char-900)",
                        border: "1px solid var(--char-700)",
                        color: STATUS_COLOR[lead.status],
                        borderRadius: "4px",
                        padding: "5px 8px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="replied">replied</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--char-950)",
  border: "1px solid var(--char-700)",
  borderRadius: "4px",
  color: "var(--steel-100)",
  fontSize: "13px",
};

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 10px",
  fontSize: "13px",
  verticalAlign: "top",
};
