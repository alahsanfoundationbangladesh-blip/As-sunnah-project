import { useEffect, useState } from "react";
import "./admin.css";
import { supabase } from "../lib/supabase";
import AdminShell from "./AdminShell";

const redirectTo = import.meta.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`;

export default function AdminApp() {
  const [authState, setAuthState] = useState("checking");
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;

    const verifyUser = async (candidate) => {
      if (!candidate) {
        if (active) {
          setUser(null);
          setAuthState("signed-out");
        }
        return;
      }

      const { data, error } = await supabase.rpc("has_admin_permission", {
        p_permission: "dashboard.view",
      });

      if (!active) return;
      if (error || !data) {
        await supabase.auth.signOut();
        setUser(null);
        setAuthState("forbidden");
        return;
      }

      setUser(candidate);
      setAuthState("authorized");
    };

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        if (active) setAuthState("signed-out");
        return;
      }
      verifyUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (active) {
          setUser(null);
          setAuthState("signed-out");
        }
        return;
      }
      if (event === "SIGNED_IN" && session?.user) {
        window.setTimeout(() => verifyUser(session.user), 0);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAuthenticated = async (candidate) => {
    setAuthError("");
    const { data, error } = await supabase.rpc("has_admin_permission", {
      p_permission: "dashboard.view",
    });

    if (error || !data) {
      await supabase.auth.signOut();
      setAuthState("forbidden");
      setAuthError("This confirmed account does not have Super Admin access.");
      return;
    }

    setUser(candidate);
    setAuthState("authorized");
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError("Sign out could not be completed. Please try again.");
  };

  if (authState === "checking") {
    return (
      <main className="admin-auth-screen">
        <section className="admin-auth-card" aria-live="polite">
          <span className="admin-brand-mark">AS</span>
          <p className="admin-eyebrow">AS-SUNNAH FOUNDATION</p>
          <h1>Checking secure access</h1>
          <p className="admin-auth-copy">Verifying your account against the database access policy…</p>
        </section>
      </main>
    );
  }

  if (authState === "authorized" && user) {
    return <AdminShell user={user} onLogout={handleLogout} />;
  }

  return (
    <AdminLogin
      key={authState}
      initialError={authError || (authState === "forbidden" ? "That account is not authorized for the admin dashboard." : "")}
      onAuthenticated={handleAuthenticated}
    />
  );
}

function AdminLogin({ initialError, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialError);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setSuccess("");
    setBusy(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === "signup") {
        const { data: invited, error: invitationError } = await supabase.rpc("is_admin_invited", {
          p_email: normalizedEmail,
        });

        if (invitationError || !invited) {
          setMessage("This email has not been approved for dashboard access.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: redirectTo },
        });

        if (error) {
          setMessage(error.message.includes("already registered")
            ? "An account already exists for this email. Use Sign in or reset its password."
            : "The account could not be created. Check the details and try again.");
          return;
        }

        if (data.session && data.user) {
          await onAuthenticated(data.user);
        } else {
          setSuccess("Account created. Confirm the verification email sent to this approved address, then sign in.");
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data.user) {
        setMessage(error?.message.toLowerCase().includes("not confirmed")
          ? "Confirm your email address before signing in."
          : "Email or password is incorrect.");
        return;
      }

      await onAuthenticated(data.user);
    } catch {
      setMessage("The sign-in service is temporarily unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-auth-screen">
      <section className="admin-auth-card">
        <div className="admin-auth-brand">
          <span className="admin-brand-mark">AS</span>
          <span>AS-Sunnah Foundation</span>
        </div>
        <p className="admin-eyebrow">SECURE ADMINISTRATION</p>
        <h1>{mode === "login" ? "Welcome back" : "Create your admin account"}</h1>
        <p className="admin-auth-copy">
          {mode === "login"
            ? "Sign in with an approved, email-verified administrator account."
            : "Only the designated Super Admin or an email invited by the Super Admin can register."}
        </p>

        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <label htmlFor="admin-email">Administrator email</label>
          <input
            id="admin-email"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            name="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={12}
            placeholder="At least 12 characters"
            required
          />

          {message && <p className="admin-form-alert" role="alert">{message}</p>}
          {success && <p className="admin-form-success" role="status">{success}</p>}

          <button className="admin-primary-button admin-auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in securely" : "Create approved account"}
          </button>
        </form>

        <button
          className="admin-text-button admin-auth-toggle"
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setMessage("");
            setSuccess("");
          }}
        >
          {mode === "login" ? "First time? Create an approved admin account" : "Already registered? Sign in"}
        </button>
        <a className="admin-back-link" href="/">Return to the public website</a>
      </section>
    </main>
  );
}
