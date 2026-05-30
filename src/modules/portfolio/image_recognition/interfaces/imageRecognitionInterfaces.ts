// interfaces/imageRecognitionInterfaces.ts
export interface ImageRecognitionRequest {
  image_url: string;
  prompt?: string;
  model: "gpt-4o" | "gemini-2.5-flash" | "gpt-4o-mini" | "gemini-2.0-flash";
}

export interface ImageRecognitionResponse {
  description: string;
  model_used: string;
  metrics: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    latency_ms: number;
  };
  timestamp: string;
}

export interface SessionMetrics {
  totalAnalyses: number;
  totalTokens: number;
  avgLatency: number;
  lastAnalysisTime: Date | null;
}

export interface ModelOption {
  value: string;
  label: string;
  provider: string;
  unsupported?: boolean; 
}