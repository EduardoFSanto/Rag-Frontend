const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  timestamp: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface DocumentSummary {
  id: string;
  filename: string;
  fileSize: number;
  status: "processing" | "processed" | "failed";
  visibility: "private" | "sector" | "company";
  createdAt: string;
}

export interface Sector {
  id: string;
  slug: string;
  name: string;
}

export interface SectorMembership extends Sector {
  role: "member" | "editor" | "admin";
}

export interface AskResponse {
  conversationId: string;
  answer: string;
  sources: Array<{ file: string; score: number }>;
  confidence: number;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const raw = await response.text();
  let result: ApiResponse<T> | null = null;

  try {
    result = raw ? (JSON.parse(raw) as ApiResponse<T>) : null;
  } catch {
    throw new Error("O servidor retornou uma resposta inválida.");
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.error?.message || "Não foi possível concluir a solicitação.");
  }

  return result.data as T;
}

export const api = {
  listConversations: () => fetchApi<ConversationSummary[]>("/api/conversations"),

  getConversation: (id: string) =>
    fetchApi<{ conversation: ConversationSummary; messages: ChatMessage[] }>(
      `/api/conversations/${id}`
    ),

  ask: (question: string, conversationId?: string) =>
    fetchApi<AskResponse>("/api/ask", {
      method: "POST",
      body: JSON.stringify({ question, conversationId }),
    }),

  listSectors: () => fetchApi<{ sectors: Sector[]; memberships: SectorMembership[] }>("/api/sectors"),

  uploadDocument: async (file: File, options: { visibility: "private" | "sector" | "company"; sectorIds: string[] }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("visibility", options.visibility);
    formData.append("sectorIds", JSON.stringify(options.sectorIds));

    const response = await fetch(`${API_URL}/api/documents/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const result = (await response.json()) as ApiResponse<{
      documentId: string;
      filename: string;
      numChunks: number;
      totalChars: number;
    }>;

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || "Não foi possível enviar o documento.");
    }

    return result.data;
  },

  listDocuments: () => fetchApi<DocumentSummary[]>("/api/documents"),

  deleteDocument: (id: string) =>
    fetchApi<{ message: string }>(`/api/documents/${id}`, { method: "DELETE" }),
};