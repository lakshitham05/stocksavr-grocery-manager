import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { startSync } from "@/lib/cloud-sync";
import { btn, btnGhost, input } from "@/components/Layout";

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [synced, setSynced] = useState(false);
  const userId = session?.user.id;

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION" || event === "USER_UPDATED") setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    setSynced(false);
    return startSync(userId, (m) => toast.error(m), () => setSynced(true));
  }, [userId]);

  if (session === undefined || (userId && !synced)) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading your shop…</div>;
  }
  if (!session) return <SignIn />;
  return <>{children}</>;
}

function SignIn() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { data, error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (mode === "up" && !data.session) setMsg("Check your email to confirm your account, then sign in.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r && "error" in r && r.error) setMsg(String((r.error as Error).message ?? r.error));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Stock<span className="text-accent">Savr</span></h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "in" ? "Sign in to see your shop on any device." : "Create an account for your shop."}
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input className={input} type="email" required placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={input} type="password" required minLength={6} placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className={`${btn} w-full`} disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</button>
        </form>
        <button className={`${btnGhost} mt-3 w-full`} onClick={google}>Continue with Google</button>
        {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
        <button className="mt-4 text-sm text-primary underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

export async function signOut() {
  await supabase.auth.signOut();
}
