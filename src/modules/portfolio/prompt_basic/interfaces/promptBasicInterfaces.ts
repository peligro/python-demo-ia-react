export interface MetricsResponse {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  latency_ms: number;
}

export interface PromptBasicRequest {
  input: string;
  model?: string;
}

export interface PromptBasicResponse {
  response: string;
  model: string;
  source: string;
  metrics: MetricsResponse;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  metrics?: MetricsResponse;
  model?: string;
}
