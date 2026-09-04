"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LogOut, Menu, MessageSquare, Settings2, Sparkles, X } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--muted-foreground)]">
        Carregando...
      </div>
    );
  }

  if (!session) return null;

  const navigation = [
    { href: "/chat", label: "Assistente", icon: MessageSquare },
    { href: "/documents", label: "Conhecimento", icon: BookOpen },
    ...((session.user as { role?: string }).role === "admin" ? [{ href: "/admin", label: "Administração", icon: Settings2 }] : []),
  ];

  return (
    <div className="flex min-h-screen text-[var(--foreground)]">
      <button aria-label="Abrir menu" onClick={() => setMobileOpen(true)} className="fixed left-4 top-4 z-30 rounded-xl border border-slate-900/10 bg-white p-2 text-slate-800 shadow-sm md:hidden">
        <Menu className="size-5" />
      </button>
      {mobileOpen && <button aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-900/25 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-900/10 bg-[var(--sidebar)] p-5 shadow-xl transition-transform md:static md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <Link href="/chat" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <span className="grid size-10 place-items-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)]"><Sparkles className="size-5" /></span>
            <span><strong className="block font-[family-name:var(--font-display)] text-lg tracking-tight">Atlas</strong><span className="text-xs text-[var(--muted-foreground)]">VR Tech support intelligence</span></span>
          </Link>
          <button aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="text-slate-500 md:hidden"><X className="size-5" /></button>
        </div>
        <p className="mb-3 mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Workspace</p>
        <nav className="space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${pathname === href ? "bg-[var(--accent)] text-white shadow-sm" : "text-[var(--muted-foreground)] hover:bg-white/70 hover:text-slate-900"}`}>
              <Icon className="size-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-slate-900/10 bg-white/65 p-4">
          <p className="text-xs font-semibold text-slate-900">Base protegida</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">Respostas ancoradas nos documentos da sua operação.</p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-900/10 pt-4">
          <div className="min-w-0"><p className="truncate text-sm font-medium">{session.user.name || "Operador"}</p><p className="truncate text-xs text-[var(--muted-foreground)]">{session.user.email}</p></div>
          <button aria-label="Sair" onClick={async () => { await signOut(); router.replace("/login"); }} className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-white/80 hover:text-slate-900"><LogOut className="size-4" /></button>
        </div>
      </aside>
      <main className="light-content min-w-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}