"use client";

import { useEffect, useState } from "react";
import { Check, Crown, LoaderCircle, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { api, type AdminUser, type Sector } from "@/lib/api";

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>();
  const [selectedSector, setSelectedSector] = useState("");
  const [membershipRole, setMembershipRole] = useState<"member" | "editor" | "admin">("member");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string>();

  async function load() {
    setLoading(true);
    try {
      const [accounts, sectorData] = await Promise.all([api.listAdminUsers(), api.listSectors()]);
      setUsers(accounts);
      setSectors(sectorData.sectors);
      setSelectedSector((current) => current || sectorData.sectors[0]?.id || "");
      setSelectedUser((current) => current || accounts[0]?.id);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar a administração.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      try {
        const [accounts, sectorData] = await Promise.all([api.listAdminUsers(), api.listSectors()]);
        if (cancelled) return;
        setUsers(accounts);
        setSectors(sectorData.sectors);
        setSelectedSector((current) => current || sectorData.sectors[0]?.id || "");
        setSelectedUser((current) => current || accounts[0]?.id);
      } catch (error) {
        if (!cancelled) setNotice(error instanceof Error ? error.message : "Não foi possível carregar a administração.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadInitialData();
    return () => { cancelled = true; };
  }, []);

  const user = users.find((account) => account.id === selectedUser);

  async function updateRole(role: "user" | "admin") {
    if (!user) return;
    setSaving(true);
    try {
      await api.updateUserRole(user.id, role);
      setUsers((current) => current.map((account) => account.id === user.id ? { ...account, role } : account));
      setNotice("Papel global atualizado.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível atualizar o papel.");
    } finally { setSaving(false); }
  }

  async function addMember() {
    if (!user || !selectedSector) return;
    setSaving(true);
    try {
      await api.addSectorMember(selectedSector, user.id, membershipRole);
      setNotice("Acesso ao setor concedido.");
      await load();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível conceder o acesso.");
    } finally { setSaving(false); }
  }

  async function removeMember(sectorId: string) {
    if (!user) return;
    setSaving(true);
    try {
      await api.removeSectorMember(sectorId, user.id);
      setUsers((current) => current.map((account) => account.id === user.id ? { ...account, memberships: account.memberships.filter((membership) => membership.sectorId !== sectorId) } : account));
      setNotice("Acesso ao setor removido.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível remover o acesso.");
    } finally { setSaving(false); }
  }

  return (
    <div className="min-h-screen overflow-y-auto px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-end justify-between gap-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Administração</p><h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">Pessoas e acessos</h1><p className="mt-3 max-w-xl text-[var(--muted-foreground)]">Organize quem pode consultar e publicar conhecimento em cada área.</p></div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 sm:flex"><ShieldCheck className="size-4 text-[var(--accent)]" /> Console protegido</div>
        </header>
        {notice && <div className="mb-6 rounded-xl border border-[var(--accent)]/20 bg-[var(--sidebar-accent)] px-4 py-3 text-sm text-slate-800">{notice}</div>}
        {loading ? <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"><LoaderCircle className="size-4 animate-spin" /> Carregando usuários...</div> : <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <section className="rounded-2xl border border-slate-900/10 bg-white/75 p-5 shadow-sm md:p-7"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Contas da organização</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">{users.length} usuários cadastrados</p></div><Users className="size-5 text-[var(--accent)]" /></div><div className="space-y-2">{users.map((account) => <button key={account.id} onClick={() => setSelectedUser(account.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${account.id === selectedUser ? "border-[var(--accent)] bg-[var(--sidebar-accent)]" : "border-slate-900/10 bg-white hover:border-[var(--primary)]/50"}`}><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--primary)] text-sm font-bold text-[var(--primary-foreground)]">{account.name.slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{account.name}</span><span className="block truncate text-xs text-[var(--muted-foreground)]">{account.email}</span></span>{account.role === "admin" && <Crown className="size-4 text-[var(--primary)]" />}</button>)}{users.length === 0 && <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Nenhum usuário encontrado.</p>}</div></section>
          {user && <section className="space-y-6"><div className="rounded-2xl border border-slate-900/10 bg-white/75 p-5 shadow-sm md:p-7"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--muted-foreground)]">Perfil selecionado</p><h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold">{user.name}</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">{user.email}</p></div><label className="text-xs font-semibold text-slate-700">Papel global</label><div className="mt-2 grid grid-cols-2 gap-2">{(["user", "admin"] as const).map((role) => <button key={role} disabled={saving} onClick={() => void updateRole(role)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${user.role === role ? "border-[var(--accent)] bg-[var(--sidebar-accent)] text-slate-900" : "border-slate-900/10 bg-white text-slate-600 hover:border-[var(--primary)]"}`}>{role === "admin" ? "Administrador" : "Usuário"}{user.role === role && <Check className="ml-2 inline size-4" />}</button>)}</div></div><div className="rounded-2xl border border-slate-900/10 bg-white/75 p-5 shadow-sm md:p-7"><div className="mb-5"><h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Acessos por setor</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">Defina quais bases aparecem no chat.</p></div><div className="space-y-2">{user.memberships.map((membership) => <div key={membership.sectorId} className="flex items-center gap-3 rounded-xl border border-slate-900/10 bg-white p-3"><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{membership.sectorName}</span><span className="text-xs text-[var(--muted-foreground)]">{membership.membershipRole}</span></span><button aria-label={`Remover acesso a ${membership.sectorName}`} onClick={() => void removeMember(membership.sectorId)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"><X className="size-4" /></button></div>)}{user.memberships.length === 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Este usuário ainda não possui acesso ao workspace.</p>}</div><div className="mt-5 border-t border-slate-900/10 pt-5"><div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-xs font-semibold text-slate-700">Conceder acesso<select value={selectedSector} onChange={(event) => setSelectedSector(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-900/15 bg-white px-3 text-sm font-normal outline-none"><option value="">Selecione um setor</option>{sectors.filter((sector) => !user.memberships.some((membership) => membership.sectorId === sector.id)).map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></label><label className="text-xs font-semibold text-slate-700">Nível<select value={membershipRole} onChange={(event) => setMembershipRole(event.target.value as typeof membershipRole)} className="mt-2 h-11 w-full rounded-xl border border-slate-900/15 bg-white px-3 text-sm font-normal outline-none"><option value="member">Membro</option><option value="editor">Editor</option><option value="admin">Admin do setor</option></select></label><button disabled={saving || !selectedSector} onClick={() => void addMember()} className="h-11 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40 sm:col-span-2"><UserPlus className="mr-2 inline size-4" />Conceder acesso</button></div></div></div></section>}
        </div>}
      </div>
    </div>
  );
}
