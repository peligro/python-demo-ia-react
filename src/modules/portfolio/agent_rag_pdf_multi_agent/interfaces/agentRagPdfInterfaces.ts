// src/modules/portfolio/agent_rag_pdf_multi_agent/interfaces/agentRagPdfInterfaces.ts

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface UploadResponse {
  job_id: number;
  status: JobStatus;
  queue_provider: string;
  message_id: string;
  message: string;
}

export interface RAGJob {
  job_id: number;
  status: JobStatus;
  filename: string;
  file_size: number | null;
  chunks_created: number | null;
  processing_time_ms: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface RAGChunk {
  id: number;
  section: string;
  question: string;
  answer: string;
  keywords: string[];
  page_number?: number | null;
  source_pdf?: string;
  created_at?: string;
}

export interface JobChunksResponse {
  job_id: number;
  total_chunks: number;
  chunks: RAGChunk[];
}

export interface ListChunksParams {
  section?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListChunksResponse {
  total: number;
  limit: number;
  offset: number;
  chunks: RAGChunk[];
}

export interface RAGQueryResponse {
  response: string;
  source: "knowledge-base" | "rag-ai" | "none";
  model_used: string;
  chunks_used: number;
  chunk_ids: number[];
  latency_ms: number;
  cache: boolean;
  similarity_score?: number;
}

export interface QueueProvider {
  name: string;
  status: 'available' | 'unavailable' | 'unconfigured';
  stream?: string;
  queue_url?: string;
}

export interface QueueProvidersResponse {
  providers: QueueProvider[];
  default: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  metrics?: {
    latency_ms: number;
    chunks_used: number;
    model_used: string;
    cache: boolean;
    source?: "knowledge-base" | "rag-ai" | "none";
    similarity_score?: number;
  };
}

// ✅ ACTUALIZADO: Agregadas las propiedades kbQueries, aiQueries y totalTokens
export interface SessionMetrics {
  totalQueries: number;
  totalChunksRetrieved: number;
  avgLatency: number;
  lastQueryTime: Date | null;
  kbQueries: number;        // ← NUEVO: Consultas respondidas desde KB
  aiQueries: number;        // ← NUEVO: Consultas respondidas desde IA
  totalTokens: number;      // ← NUEVO: Total de tokens estimados
}