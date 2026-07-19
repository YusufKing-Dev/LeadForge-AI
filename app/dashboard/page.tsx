import { createClient } from "@/lib/supabase-server";
import LeadsTable from "./leads-table";
import SignOutButton from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("site_score", { ascending: true, nullsFirst: true });

  return (
    <main style={{ minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div>
            <span
              className="display"
              style={{
                fontSize: "13px",
                letterSpacing: "0.14em",
                color: "var(--ember)",
                fontWeight: 600,
              }}
            >
              ◆ LEADFORGE
            </span>
            <h1
              className="display"
              style={{ fontSize: "26px", margin: "6px 0 0", fontWeight: 700 }}
            >
              Leads
            </h1>
          </div>
          <SignOutButton />
        </header>

        {error && (
          <p style={{ color: "#ff9d80" }}>
            Couldn&apos;t load leads: {error.message}
          </p>
        )}

        <LeadsTable initialLeads={leads ?? []} />
      </div>
    </main>
  );
}
