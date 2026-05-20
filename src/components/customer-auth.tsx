"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client/client";
import { ROLE_HOME } from "@/lib/auth/roles";
import { PageLoader } from "@/components/ui/page-loader";

// ─── OTP boxes ────────────────────────────────────────────────────────────────
function OTPBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function set(i: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1);
    const arr = (value.padEnd(6, " ")).split("").slice(0, 6);
    arr[i] = digit || " ";
    const next = arr.join("").trimEnd();
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace") {
      if (!value[i]?.trim() && i > 0) {
        refs.current[i - 1]?.focus();
      } else {
        const arr = (value.padEnd(6, " ")).split("").slice(0, 6);
        arr[i] = " ";
        onChange(arr.join("").trimEnd());
      }
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  }

  return (
    <div className="ll-otp-row">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={(value[i] ?? "").trim()}
          ref={(el) => { refs.current[i] = el; }}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          className="ll-otp-box"
        />
      ))}
    </div>
  );
}

// ─── Auth method toggle tabs ──────────────────────────────────────────────────
function MethodTabs({
  active,
  onChange,
}: {
  active: "phone" | "email";
  onChange: (m: "phone" | "email") => void;
}) {
  return (
    <div className="flex w-full max-w-[380px] border-[1.5px] border-border rounded-lg overflow-hidden my-1 mb-4">
      {(["phone", "email"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`flex-1 h-[38px] border-none cursor-pointer text-[0.8rem] font-semibold transition-all ${
            active === m ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"
          }`}
        >
          {m === "phone" ? "📱 Phone OTP" : "✉ Email"}
        </button>
      ))}
    </div>
  );
}

// ─── Cooldown helper ──────────────────────────────────────────────────────────
function useCooldown(seconds = 30) {
  const [cd, setCd] = useState(0);
  function start() {
    setCd(seconds);
    const iv = setInterval(() => {
      setCd((c) => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; });
    }, 1000);
  }
  return { cd, start };
}

// ─── Sign-In form ─────────────────────────────────────────────────────────────
function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { cd, start: startCooldown } = useCooldown();

  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"creds" | "otp">("creds");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() { setStep("creds"); setOtp(""); setError(null); }
  function switchMethod(m: "phone" | "email") { setMethod(m); reset(); }

  async function redirect(role: string | undefined, next: string | null) {
    const supabaseCli = createClient();
    const { data: { user } } = await supabaseCli.auth.getUser();
    
    if (role && user?.user_metadata?.profile_complete) {
      router.replace(next?.startsWith("/") ? next : (ROLE_HOME[role] ?? "/"));
      return;
    }

    try {
      const res = await fetch("/api/auth/profile-status");
      if (res.ok) {
        const status = await res.json() as { complete: boolean; role: string };
        if (status.role) role = status.role;
        if (!status.complete && role) {
          const onboardUrl = `/onboarding/complete?role=${encodeURIComponent(role)}${next ? `&next=${encodeURIComponent(next)}` : ""}`;
          router.replace(onboardUrl);
          return;
        }
      }
    } catch {}

    if (!role) {
      setError("Account setup incomplete.");
      return;
    }

    setRedirecting(true);
    router.replace(next?.startsWith("/") ? next : (ROLE_HOME[role] ?? "/"));
  }

  async function sendOTP() {
    const clean = phone.replace(/\D/g, "").slice(0, 10);
    if (clean.length < 10) { setError("Enter a valid 10-digit mobile number"); return; }
    setLoading(true); setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      phone: `+91${clean}`,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (err) {
      setError(err.message.toLowerCase().includes("not found") ? "No account found. Sign up first." : err.message);
      return;
    }
    setOtp(""); setStep("otp"); startCooldown();
  }

  async function verifyOTP() {
    const token = otp.replace(/\s/g, "");
    if (token.length < 6) { setError("Enter the 6-digit OTP"); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: `+91${phone.replace(/\D/g, "").slice(0, 10)}`,
      token,
      type: "sms",
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    redirect(data.user?.user_metadata?.role as string, searchParams.get("next"));
  }

  async function signInEmail() {
    if (!email.trim() || !password) { setError("Enter fields"); return; }
    setLoading(true); setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    redirect(data.user?.user_metadata?.role as string, searchParams.get("next"));
  }

  return (
    <>
    <PageLoader show={redirecting} />
    <form className="ll-form ll-form-signin" onSubmit={(e) => e.preventDefault()}>
      <h2 className="ll-title">Sign in</h2>
      <MethodTabs active={method} onChange={switchMethod} />

      {method === "phone" ? (
        step === "creds" ? (
          <>
            <div className="ll-field">
              <span className="ll-phone-prefix">+91</span>
              <input type="tel" placeholder="Mobile number" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
            </div>
            {error && <p className="ll-error">{error}</p>}
            <button className="ll-btn" onClick={sendOTP} disabled={loading}>{loading ? <span className="ll-spinner" /> : "Send OTP"}</button>
          </>
        ) : (
          <>
            <button type="button" className="ll-back-btn" onClick={reset}>← Change number</button>
            <OTPBoxes value={otp} onChange={(v) => { setOtp(v); setError(null); }} />
            {error && <p className="ll-error">{error}</p>}
            <button className="ll-btn" onClick={verifyOTP} disabled={loading}>{loading ? <span className="ll-spinner" /> : "Verify & Sign In"}</button>
          </>
        )
      ) : (
        <>
          <div className="ll-field"><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="ll-field"><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error && <p className="ll-error">{error}</p>}
          <button className="ll-btn" onClick={signInEmail} disabled={loading}>Sign In</button>
        </>
      )}
    </form>
    </>
  );
}

// ─── Sign-Up form ─────────────────────────────────────────────────────────────
function SignUpForm() {
  const supabase = createClient();
  const { cd, start: startCooldown } = useCooldown();
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"details" | "otp" | "done">("details");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() { setStep("details"); setOtp(""); setError(null); }
  function switchMethod(m: "phone" | "email") { setMethod(m); reset(); }

  async function sendOTP() {
    if (!name.trim()) { setError("Enter name"); return; }
    const clean = phone.replace(/\D/g, "").slice(0, 10);
    if (clean.length < 10) { setError("Enter valid number"); return; }
    setLoading(true);
    const { error: signupErr } = await supabase.auth.signInWithOtp({
      phone: `+91${clean}`,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (signupErr) { setError(signupErr.message); return; }
    setStep("otp"); startCooldown();
  }

  async function verifyOTP() {
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: `+91${phone.replace(/\D/g, "").slice(0, 10)}`,
      token: otp.replace(/\s/g, ""),
      type: "sms",
    });
    if (err) { setError(err.message); return; }
    await supabase.auth.updateUser({ data: { role: "customer", name: name.trim() } });
    setStep("done");
  }

  async function signUpEmail() {
    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { role: "customer", name: name.trim() } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep("done");
  }

  if (step === "done") return <div className="p-8 text-center"><h2 className="ll-title">Welcome!</h2><p>Account created successfully.</p></div>;

  return (
    <form className="ll-form ll-form-signup" onSubmit={(e) => e.preventDefault()}>
      <h2 className="ll-title">Create Account</h2>
      <MethodTabs active={method} onChange={switchMethod} />
      <div className="ll-field"><input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} /></div>
      {method === "phone" ? (
        step === "details" ? (
          <>
            <div className="ll-field"><input type="tel" placeholder="Mobile" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} /></div>
            <button className="ll-btn" onClick={sendOTP} disabled={loading}>Send OTP</button>
          </>
        ) : (
          <><OTPBoxes value={otp} onChange={(v) => { setOtp(v); setError(null); }} /><button className="ll-btn" onClick={verifyOTP}>Verify</button></>
        )
      ) : (
        <>
          <div className="ll-field"><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="ll-field"><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <button className="ll-btn" onClick={signUpEmail}>Sign Up</button>
        </>
      )}
    </form>
  );
}

export function CustomerAuth({ mode }: { mode: "signin" | "signup" }) {
  const [signUpMode, setSignUpMode] = useState(mode === "signup");

  return (
    <div className={`ll-container ${signUpMode ? "ll-signup-mode" : ""} min-h-screen items-center justify-center`}>
      <div className="ll-forms">
        <div className="ll-signin-signup">
          <Suspense fallback={null}><SignInForm /></Suspense>
          <SignUpForm />
        </div>
      </div>

      <div className="ll-panels">
        <div className="ll-panel ll-panel-left">
          <div className="ll-panel-content">
            <h3 className="text-3xl font-black mb-4">First visit?</h3>
            <p className="opacity-80 mb-8">Book appointments, track history, and get exclusive rewards at India&apos;s best salons.</p>
            <button className="ll-btn-outline" onClick={() => setSignUpMode(true)}>Join Now</button>
          </div>
          <img src="/images/login-illustration.png" alt="Leaex" className="ll-panel-img" />
        </div>

        <div className="ll-panel ll-panel-right">
          <div className="ll-panel-content">
            <h3 className="text-3xl font-black mb-4">Welcome Back!</h3>
            <p className="opacity-80 mb-8">Sign in to manage your appointments and access your digital salon profile.</p>
            <button className="ll-btn-outline" onClick={() => setSignUpMode(false)}>Sign In</button>
          </div>
          <img src="/images/signup-illustration.png" alt="Leaex" className="ll-panel-img" />
        </div>
      </div>
    </div>
  );
}
