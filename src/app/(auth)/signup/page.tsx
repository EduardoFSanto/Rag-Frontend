"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { signUp } from "@/lib/auth-client";

export default function SignupPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event: FormEvent) {
		event.preventDefault(); setLoading(true); setError("");
		try { const result = await signUp.email({ name, email, password }); if (result.error) { setError(result.error.message ?? "Não foi possível criar sua conta."); return; } router.push("/chat"); } catch { setError("Não foi possível conectar ao servidor."); } finally { setLoading(false); }
	}

	return <main className="grid min-h-screen place-items-center px-5 py-10"><div className="w-full max-w-md"><div className="mb-8 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)]"><Sparkles className="size-5" /></span><span className="font-[family-name:var(--font-display)] text-xl font-semibold">Atlas</span></div><div className="rounded-3xl border border-white/10 bg-white/[0.05] p-7 shadow-2xl backdrop-blur-xl md:p-9"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Comece agora</p><h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold">Crie seu acesso</h1><p className="mt-2 text-sm text-[var(--muted-foreground)]">Entre na central de inteligência da sua operação.</p><form onSubmit={handleSubmit} className="mt-8 space-y-4"><input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Nome completo" className="auth-input" /><input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" placeholder="E-mail corporativo" className="auth-input" /><input value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} type="password" placeholder="Senha (mínimo 8 caracteres)" className="auth-input" />{error && <p className="text-sm text-red-300">{error}</p>}<button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] hover:brightness-110 disabled:opacity-50">{loading ? <LoaderCircle className="size-4 animate-spin" /> : <>Criar conta <ArrowRight className="size-4" /></>}</button></form><p className="mt-7 text-center text-sm text-[var(--muted-foreground)]">Já tem acesso? <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline">Entrar</Link></p></div></div></main>;
}
