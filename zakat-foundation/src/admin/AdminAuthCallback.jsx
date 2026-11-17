import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminAuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirming your secure sign-in…");

  useEffect(() => {
    let active = true;
    const finishAuthentication = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const nextPath = params.get("next");
      const safeNextPath = nextPath?.startsWith("/admin") ? nextPath : "/admin";

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setMessage("This sign-in link has expired. Return to the admin login and request a new one.");
          return;
        }
      } else {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          if (active) setMessage("This sign-in link could not be verified. Return to the admin login and try again.");
          return;
        }
      }

      if (active) navigate(safeNextPath, { replace: true });
    };

    finishAuthentication();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <main className="admin-auth-screen">
      <section className="admin-auth-card" aria-live="polite">
        <span className="admin-brand-mark">AS</span>
        <p className="admin-eyebrow">AS-SUNNAH FOUNDATION</p>
        <h1>Secure sign-in</h1>
        <p className="admin-auth-copy">{message}</p>
      </section>
    </main>
  );
}
