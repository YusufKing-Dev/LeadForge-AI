"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: "none",
        border: "1px solid var(--char-700)",
        color: "var(--steel-300)",
        borderRadius: "4px",
        padding: "8px 14px",
        fontSize: "13px",
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
