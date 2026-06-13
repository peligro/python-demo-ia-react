//src/modules/portfolio/chat_history/interfaces/chatHistoryInterfaces.ts
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface ChatHistoryRequest {
  messages: ChatMessage[];
  model?: string;
  max_history?: number;
}

export interface ChatHistoryResponse {
  response: string;
  model_used: string;
  messages_count: number;
  metrics: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    latency_ms: number;
  };
  timestamp: string;
}

export interface SessionMetrics {
  totalChats: number;
  totalTokens: number;
  avgLatency: number;
  lastChatTime: Date | null;
  messagesExchanged: number;
}