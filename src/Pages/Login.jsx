import React, { useState } from "react";
import { supabase } from "@/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState("signin"); // signin | signup
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const navigate = useNavigate();

  const upsertProfile = async (user, { setDefaultRole = false } = {}) => {
    if (!user?.id) return;
    const roleFromMetadata = user.user_metadata?.role;
    await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        full_name: name.trim() || user.user_metadata?.full_name || null,
        phone: phone.trim() || user.user_metadata?.phone || null,
        email: user.email || null,
        ...(setDefaultRole
          ? { role: roleFromMetadata || "user" }
          : roleFromMetadata
          ? { role: roleFromMetadata }
          : {}),
      },
      { onConflict: "user_id" }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorText("Email and password are required");
      return;
    }
    setLoading(true);
    setErrorText("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim() || null,
              phone: phone.trim() || null,
              role: "user",
            },
            emailRedirectTo: null,
          },
        });
        if (error) throw error;
        if (data?.user) {
          await upsertProfile(data.user, { setDefaultRole: true });
          navigate("/", { replace: true });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data?.user) {
          await upsertProfile(data.user);
        }
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Auth error:", err);
      setErrorText(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {mode === "signup" ? "Create account" : "Sign in"}
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300">
            Use email and password to access your tables.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-sm text-stone-700 dark:text-stone-200">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                placeholder="Name"
                autoComplete="name"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm text-stone-700 dark:text-stone-200">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              placeholder="Email address"
              autoComplete="email"
            />
          </div>
          {mode === "signup" && (
            <div className="space-y-2">
              <label className="text-sm text-stone-700 dark:text-stone-200">Phone (for notifications)</label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                placeholder="+1 555 123 4567"
                autoComplete="tel"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm text-stone-700 dark:text-stone-200">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl bg-stone-50 dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-700 hover:bg-amber-800 rounded-xl"
            disabled={loading}
          >
            {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        {errorText && (
          <div className="text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-3">
            {errorText}
          </div>
        )}

        <div className="text-sm text-stone-600 dark:text-stone-300 text-center">
          {mode === "signup" ? "Already have an account?" : "Need an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-amber-700 hover:text-amber-800 font-semibold"
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
