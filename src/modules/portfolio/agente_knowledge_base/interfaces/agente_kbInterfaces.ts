//src/modules/portfolio/agente_knowledge_base/interfaces/agente_kbInterfaces.ts

export interface MetricsResponse {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  latency_ms: number;
}

export interface QueryRequest {
  input: string;
  model?: string;  // opcional: "mistral-small-latest", "gemini-2.0-flash", etc.
}

export interface QueryResponse {
  response: string;
  // chatId: string;  ← Lo quitamos como acordamos
  messageId: string;
  model: string;
  source: "knowledge-base" | "plai-ai" | "error";
  contextWasUsed?: boolean;
  userName?: string;
  timestamp: string;
  requiresHuman: boolean;
  metrics?: MetricsResponse;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  source?: QueryResponse["source"];
  metrics?: MetricsResponse;
  model?: string;
}

export interface AgenteKBState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  selectedModel: string;
}
export interface SessionMetrics {
  totalQueries: number;
  totalTokens: number;
  kbQueries: number;
  aiQueries: number;
  avgLatency: number;
  lastQueryTime: Date | null;
}
