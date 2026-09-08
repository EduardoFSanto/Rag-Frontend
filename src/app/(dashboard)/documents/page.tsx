"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Film, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { api, type DocumentSummary, type Sector } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type Visibility = "private" | "sector" | "company";

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const visibilityLabels: Record<Visibility, string> = {
  private: "Somente eu",
  sector: "Setores selecionados",
  company: "Toda a empresa",
};

export default function DocumentsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [visibility, setVisibility] = useState<Visibility>("sector");
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string }>();
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [documentList, sectorData] = await Promise.all([api.listDocuments(), api.listSectors()]);
      setDocuments(documentList);
      setSectors(sectorData.sectors);
      if (selectedSectors.length === 0 && sectorData.sectors.length > 0) setSelectedSectors([sectorData.sectors[0].id]);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível carregar a base." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      try {
        const [documentList, sectorData] = await Promise.all([api.listDocuments(), api.listSectors()]);
        if (cancelled) return;
        setDocuments(documentList);
        setSectors(sectorData.sectors);
        if (sectorData.sectors.length > 0) setSelectedSectors((current) => current.length === 0 ? [sectorData.sectors[0].id] : current);
      } catch (error) {
        if (!cancelled) setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível carregar a base." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadInitialData();
    return () => { cancelled = true; };
  }, []);

  function toggleSector(id: string) {
    setSelectedSectors((current) => current.includes(id) ? current.filter((sectorId) => sectorId !== id) : [...current, id]);
  }

  async function upload(file?: File) {
    if (!file) return;
    if (!/application\/pdf|text\/plain/.test(file.type)) { setNotice({ type: "error", text: "Envie um arquivo PDF ou TXT." }); return; }
    if (file.size > 10 * 1024 * 1024) { setNotice({ type: "error", text: "O arquivo deve ter no máximo 10 MB." }); return; }
    if (visibility === "sector" && selectedSectors.length === 0) { setNotice({ type: "error", text: "Selecione pelo menos um setor." }); return; }
    setUploading(true);
    setNotice(undefined);
    try {
      await api.uploadDocument(file, { visibility, sectorIds: visibility === "sector" ? selectedSectors : [] });
      setNotice({ type: "success", text: "Documento processado e adicionado à base." });
      await refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível enviar o documento." });
    } finally {
      setUploading(false);
    }
  }

  async function removeDocument(id: string) {
    if (!window.confirm("Remover este documento da base de conhecimento?")) return;
    try {
      await api.deleteDocument(id);
      setDocuments((current) => current.filter((document) => document.id !== id));
      setNotice({ type: "success", text: "Documento removido da base." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível remover o documento." });
    }
  }

  async function importVideo() {
    const url = videoUrl.trim();
    if (!url) return;
    setUploading(true);
    setNotice(undefined);
    try {
      const result = await api.importYoutubeVideo(url, visibility === "company" ? "company" : "private");
      setVideoUrl("");
      setNotice({ type: "success", text: `Vídeo "${result.title}" importado com ${result.transcriptSource === "captions" ? "legendas oficiais" : "transcrição Whisper"}.` });
      await refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Não foi possível importar o vídeo." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Knowledge base</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">Conhecimento da operação</h1>
            <p className="mt-3 max-w-xl text-[var(--muted-foreground)]">Publique uma fonte uma vez e entregue o contexto certo para cada equipe.</p>
          </div>
          {isAdmin ? <button onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-[var(--primary-foreground)] transition hover:brightness-110 disabled:opacity-50">
            <UploadCloud className="size-4" />{uploading ? "Processando..." : "Adicionar documento"}
          </button> : <span className="rounded-full border border-slate-900/10 bg-white/80 px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)]">Publicação restrita a administradores</span>}
          <input ref={inputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" hidden onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        </div>

        {notice && <div className={`mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm ${notice.type === "success" ? "border-emerald-700/20 bg-emerald-50 text-emerald-800" : "border-red-700/20 bg-red-50 text-red-800"}`}>{notice.type === "success" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}{notice.text}</div>}

        {isAdmin && <section className="mb-6 rounded-2xl border border-slate-900/10 bg-white/75 p-5 shadow-sm md:p-7">
          <div className="mb-5"><h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Defina o alcance da publicação</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">A permissão será aplicada no backend e nos filtros de recuperação.</p></div>
          <div className="grid gap-3 md:grid-cols-3">
            {(Object.keys(visibilityLabels) as Visibility[]).map((option) => <button key={option} type="button" onClick={() => setVisibility(option)} className={`rounded-xl border p-4 text-left transition ${visibility === option ? "border-[var(--accent)] bg-[var(--sidebar-accent)]" : "border-slate-900/10 bg-white hover:border-[var(--primary)]/50"}`}><span className="block text-sm font-semibold">{visibilityLabels[option]}</span><span className="mt-1 block text-xs leading-5 text-[var(--muted-foreground)]">{option === "private" ? "Disponível apenas para sua conta." : option === "company" ? "Disponível para todos os membros." : "Disponível somente para os setores marcados."}</span></button>)}
          </div>
          {visibility === "sector" && <div className="mt-5 flex flex-wrap gap-2">{sectors.map((sector) => <button key={sector.id} type="button" onClick={() => toggleSector(sector.id)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${selectedSectors.includes(sector.id) ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-slate-900/15 bg-white text-slate-700 hover:border-[var(--primary)]"}`}>{sector.name}</button>)}{sectors.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">Nenhum setor configurado.</p>}</div>}
          <div className="mt-6 border-t border-slate-900/10 pt-5"><label className="text-xs font-semibold text-slate-700">Importar um vídeo do YouTube<input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="auth-input mt-2" /></label><button type="button" disabled={uploading || !videoUrl.trim()} onClick={() => void importVideo()} className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"><Film className="size-4" />{uploading ? "Transcrevendo e indexando..." : "Importar vídeo"}</button><p className="mt-2 text-xs text-[var(--muted-foreground)]">Usaremos a legenda oficial quando existir e Whisper como fallback.</p></div>
        </section>}

        <section className="rounded-2xl border border-slate-900/10 bg-white/75 p-5 shadow-sm md:p-7">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">Documentos acessíveis</h2><p className="mt-1 text-sm text-[var(--muted-foreground)]">PDF e TXT, até 10 MB por arquivo.</p></div><span className="rounded-full bg-[var(--sidebar-accent)] px-3 py-1 text-xs font-semibold text-slate-700">{documents.length} arquivos</span></div>
          {loading ? <div className="flex items-center gap-2 py-10 text-sm text-[var(--muted-foreground)]"><LoaderCircle className="size-4 animate-spin" /> Carregando base...</div> : documents.length === 0 ? <div className="rounded-xl border border-dashed border-slate-900/15 py-12 text-center"><FileText className="mx-auto size-8 text-slate-400" /><p className="mt-3 text-sm font-semibold">Nenhum documento acessível ainda</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">Adicione manuais, políticas ou transcrições para começar.</p></div> : <div className="divide-y divide-slate-900/10">{documents.map((document) => <div key={document.id} className="flex items-center gap-4 py-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--sidebar-accent)] text-[var(--accent)]"><FileText className="size-5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{document.filename}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{document.sourceType === "youtube" ? "YouTube" : formatBytes(document.fileSize)} · {visibilityLabels[document.visibility]}</p></div><span className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${document.status === "processed" ? "bg-emerald-50 text-emerald-700" : document.status === "failed" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{document.status === "processed" ? "Indexado" : document.status === "failed" ? "Falhou" : "Processando"}</span><button aria-label={`Remover ${document.filename}`} onClick={() => void removeDocument(document.id)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></button></div>)}</div>}
        </section>
      </div>
    </div>
  );
}