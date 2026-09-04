"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { api, type DocumentSummary } from "@/lib/api";

function formatBytes(bytes: number) {
	return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsPage() {
	const [documents, setDocuments] = useState<DocumentSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [notice, setNotice] = useState<{ type: "success" | "error"; text: string }>();
	const inputRef = useRef<HTMLInputElement>(null);

	async function refresh() {
		setLoading(true);
		try { setDocuments(await api.listDocuments()); } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível carregar os documentos." }); } finally { setLoading(false); }
	}

	useEffect(() => {
		api.listDocuments()
			.then(setDocuments)
			.catch((error) => setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível carregar os documentos." }))
			.finally(() => setLoading(false));
	}, []);

	async function upload(file?: File) {
		if (!file) return;
		if (!/application\/pdf|text\/plain/.test(file.type)) { setNotice({ type: "error", text: "Envie um arquivo PDF ou TXT." }); return; }
		if (file.size > 10 * 1024 * 1024) { setNotice({ type: "error", text: "O arquivo deve ter no máximo 10 MB." }); return; }
		setUploading(true); setNotice(undefined);
		try { await api.uploadDocument(file); setNotice({ type: "success", text: "Documento enviado. A base está sendo atualizada." }); await refresh(); } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível enviar o documento." }); } finally { setUploading(false); }
	}

	async function removeDocument(id: string) {
		if (!window.confirm("Remover este documento da base de conhecimento?")) return;
		try { await api.deleteDocument(id); setDocuments((current) => current.filter((document) => document.id !== id)); setNotice({ type: "success", text: "Documento removido da base." }); } catch (error) { setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível remover o documento." }); }
	}

	return <div className="min-h-screen overflow-y-auto px-5 py-8 md:px-10 md:py-12"><div className="mx-auto max-w-5xl"><div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Knowledge base</p><h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">Conhecimento da operação</h1><p className="mt-3 max-w-xl text-[var(--muted-foreground)]">Gerencie os documentos que o Atlas consulta para apoiar o time de suporte.</p></div><button onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:brightness-110 disabled:opacity-50"><UploadCloud className="size-4" />{uploading ? "Processando..." : "Adicionar documento"}</button><input ref={inputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} /></div>{notice && <div className={`mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm ${notice.type === "success" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-red-400/20 bg-red-400/10 text-red-200"}`}>{notice.type === "success" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}{notice.text}</div>}<div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 md:p-7"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Documentos indexados</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">PDF e TXT, até 10 MB por arquivo.</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-[var(--muted-foreground)]">{documents.length} arquivos</span></div>{loading ? <div className="flex items-center gap-2 py-12 text-sm text-[var(--muted-foreground)]"><LoaderCircle className="size-4 animate-spin" /> Carregando base...</div> : documents.length === 0 ? <div className="rounded-xl border border-dashed border-white/15 px-6 py-14 text-center"><FileText className="mx-auto size-8 text-[var(--muted-foreground)]" /><p className="mt-4 font-medium">Sua base ainda está vazia</p><p className="mt-2 text-sm text-[var(--muted-foreground)]">Adicione os procedimentos, políticas e transcrições que orientam seu suporte.</p></div> : <div className="divide-y divide-white/10">{documents.map((document) => <div key={document.id} className="flex items-center gap-4 py-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)]"><FileText className="size-5 text-[var(--primary)]" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{document.filename}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{formatBytes(document.fileSize)} · {new Date(document.createdAt).toLocaleDateString("pt-BR")}</p></div><span className={`hidden rounded-full px-2.5 py-1 text-xs sm:inline-flex ${document.status === "processed" ? "bg-emerald-400/10 text-emerald-300" : document.status === "failed" ? "bg-red-400/10 text-red-300" : "bg-amber-400/10 text-amber-200"}`}>{document.status === "processed" ? "Pronto" : document.status === "failed" ? "Falhou" : "Processando"}</span><button aria-label={`Remover ${document.filename}`} onClick={() => void removeDocument(document.id)} className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-red-400/10 hover:text-red-300"><Trash2 className="size-4" /></button></div>)}</div>}</div></div></div>;
}
