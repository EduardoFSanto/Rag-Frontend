"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowUp, BookOpen, Check, Copy, LoaderCircle, Plus, Search, Sparkles } from "lucide-react";
import { api, type ChatMessage, type ConversationSummary } from "@/lib/api";

interface Message extends ChatMessage {
  sources?: Array<{ file: string; score: number }>;
  pending?: boolean;
  error?: boolean;
}

const starterPrompts = [
  "Qual é o procedimento recomendado para abrir um chamado?",
  "Como devo orientar um cliente com problema de acesso?",
  "Resuma as políticas mais importantes do suporte.",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copied, setCopied] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listConversations().then(setConversations).catch(() => undefined).finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function openConversation(id: string) {
    setLoadingHistory(true);
    try {
      const result = await api.getConversation(id);
      setConversationId(id);
      setMessages(result.messages);
    } finally {
      setLoadingHistory(false);
    }
  }

  function newConversation() {
    setConversationId(undefined);
    setMessages([]);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const currentQuestion = question.trim();
    if (!currentQuestion || loading || currentQuestion.length > 5000) return;
    setQuestion("");
    setLoading(true);
    const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [...prev, { id: optimisticId, role: "user", content: currentQuestion, createdAt: new Date().toISOString() }]);
    try {
      const result = await api.ask(currentQuestion, conversationId);
      setConversationId(result.conversationId);
      setMessages((prev) => [...prev, { id: `answer-${Date.now()}`, role: "assistant", content: result.answer, sources: result.sources, createdAt: new Date().toISOString() }]);
      const refreshed = await api.listConversations();
      setConversations(refreshed);
    } catch (error) {
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: "assistant", content: error instanceof Error ? error.message : "Não foi possível responder agora.", createdAt: new Date().toISOString(), error: true }]);
    } finally { setLoading(false); }
  }

  async function copyAnswer(message: Message) {
    await navigator.clipboard.writeText(message.content);
    setCopied(message.id);
    window.setTimeout(() => setCopied(undefined), 1600);
  }

  return (
    <div className="flex h-screen min-h-[620px] flex-col">
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-900/10 px-6 pl-16 md:px-10 md:pl-10">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Support intelligence</p><h1 className="font-[family-name:var(--font-display)] text-xl font-semibold">Assistente de conhecimento</h1></div>
        <button onClick={newConversation} className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white/75 px-3 py-2 text-sm text-slate-800 shadow-sm transition hover:bg-white"><Plus className="size-4" /> Nova conversa</button>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-slate-900/10 p-5 lg:block">
          <div className="mb-5 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Conversas</span><Search className="size-4 text-[var(--muted-foreground)]" /></div>
          <div className="space-y-1 overflow-y-auto">
            {loadingHistory ? <p className="text-sm text-[var(--muted-foreground)]">Carregando histórico...</p> : conversations.map((conversation) => <button key={conversation.id} onClick={() => openConversation(conversation.id)} className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${conversation.id === conversationId ? "bg-white/10 text-white" : "text-[var(--muted-foreground)] hover:bg-white/5 hover:text-white"}`}><span className="block truncate">{conversation.title || "Nova conversa"}</span><span className="mt-1 block text-[11px] opacity-60">{new Date(conversation.updatedAt).toLocaleDateString("pt-BR")}</span></button>)}
            {!loadingHistory && conversations.length === 0 && <p className="text-sm leading-6 text-[var(--muted-foreground)]">Suas conversas aparecerão aqui.</p>}
          </div>
        </aside>
        <section className="relative flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 md:px-12 lg:px-[clamp(3rem,10vw,10rem)]">
            {messages.length === 0 ? <div className="mx-auto flex max-w-3xl flex-col justify-center py-[clamp(3rem,12vh,9rem)]"><div className="mb-7 grid size-14 place-items-center rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_0_40px_oklch(0.76_0.15_82/20%)]"><Sparkles className="size-7" /></div><p className="mb-3 text-sm font-semibold text-[var(--primary)]">Bom dia, operador</p><h2 className="max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Encontre a resposta certa, no momento certo.</h2><p className="mt-5 max-w-lg text-base leading-7 text-[var(--muted-foreground)]">Consulte os procedimentos, políticas e materiais internos da VR Tech com respostas apoiadas pela sua base de conhecimento.</p><div className="mt-10 grid gap-3 md:grid-cols-3">{starterPrompts.map((prompt) => <button key={prompt} onClick={() => setQuestion(prompt)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left text-sm leading-5 text-white/80 transition hover:-translate-y-0.5 hover:border-[var(--primary)]/50 hover:bg-white/[0.07]">{prompt}</button>)}</div></div> : <div className="mx-auto max-w-3xl space-y-8">{messages.map((message) => <article key={message.id} className={`group flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] ${message.role === "user" ? "rounded-2xl rounded-tr-sm bg-[var(--accent)] px-5 py-4" : "min-w-0"}`}><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">{message.role === "assistant" ? <><Sparkles className="size-3 text-[var(--primary)]" /> Atlas</> : "Você"}</div><p className={`whitespace-pre-wrap text-[15px] leading-7 ${message.error ? "text-red-300" : "text-white/90"}`}>{message.content}</p>{message.role === "assistant" && !message.error && <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-3"><button onClick={() => copyAnswer(message)} className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-white">{copied === message.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied === message.id ? "Copiado" : "Copiar"}</button>{message.sources?.length ? <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]"><BookOpen className="size-3.5" />{message.sources.length} fontes consultadas</span> : null}</div>}{message.sources?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.sources.map((source) => <span key={`${message.id}-${source.file}`} className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[var(--muted-foreground)]">{source.file}</span>)}</div> : null}</div></article>)}{loading && <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]"><LoaderCircle className="size-4 animate-spin text-[var(--primary)]" /> Consultando a base de conhecimento...</div>}<div ref={bottomRef} /></div>}
          </div>
          <div className="shrink-0 px-5 pb-6 md:px-12 md:pb-8 lg:px-[clamp(3rem,10vw,10rem)]"><form onSubmit={handleSend} className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-2 shadow-2xl backdrop-blur-xl"><textarea value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(e); } }} disabled={loading} maxLength={5000} rows={1} placeholder="Pergunte sobre seus procedimentos..." className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/35" /><button aria-label="Enviar pergunta" type="submit" disabled={loading || !question.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="size-5" /></button></form><div className="mx-auto mt-2 flex max-w-3xl justify-between px-2 text-[11px] text-[var(--muted-foreground)]"><span>Shift + Enter para nova linha</span><span>{question.length}/5000</span></div></div>
        </section>
      </div>
    </div>
  );
}