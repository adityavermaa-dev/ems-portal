import React, { useState } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../store/useAuthStore";
import { useForm } from "../hooks/useForm";

export function LoginScreen() {
  const form = useForm({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setUser = useAuthStore((state) => state.setUser);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await api.login(form.values);
      setUser(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Zustand Tech</p>
          <h1>EMS Portal</h1>
          <p className="muted">Centralized employee, lead, attendance, task, and communication operations.</p>
        </div>
        <form className="stack" onSubmit={submit}>
          <label>
            Email
            <input type="email" value={form.values.email} onChange={(e) => form.set("email", e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={form.values.password} onChange={(e) => form.set("password", e.target.value)} required />
          </label>
          {error && <div className="alert danger">{error}</div>}
          <button className="primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
