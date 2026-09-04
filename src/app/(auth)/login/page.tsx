"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await signIn.email({ email, password });
      if (error) {
        setError(error.message ?? "Não foi possível entrar.");
        return;
      }
      router.push("/chat");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)]"><Sparkles className="size-5" /></span><span className="font-[family-name:var(--font-display)] text-xl font-semibold">Atlas</span></div>
      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 shadow-2xl backdrop-blur-xl md:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Bem-vindo de volta</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold">Acesse seu workspace</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Consulte a inteligência da sua operação em um só lugar.</p>
        <div className="mt-8 space-y-4">

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="auth-input"
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="auth-input"
        />

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] hover:brightness-110 disabled:opacity-50">
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : <>Entrar no Atlas <ArrowRight className="size-4" /></>}
        </button>
        </div>
        <p className="mt-7 text-center text-sm text-[var(--muted-foreground)]">Ainda não tem acesso? <Link href="/signup" className="font-semibold text-[var(--primary)] hover:underline">Criar conta</Link></p>
      </form>
      </div>
    </main>
  );
}