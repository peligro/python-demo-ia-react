export type SentimentType = "positive" | "negative" | "neutral";

export interface SentimentAnalysisRequest {
  text: string;
  model?: string;
  language?: string;
}

export interface SentimentAnalysisResponse {
  text: string;
  sentiment: SentimentType;
  sentiment_label: string;
  confidence?: number;
  explanation?: string;
  model_used: string;
  metrics: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    latency_ms: number;
  };
  timestamp: string;
}

export interface SentimentHistoryItem {
  id: string;
  text: string;
  sentiment: SentimentType;
  confidence?: number;
  timestamp: string;
}

export interface SessionMetrics {
  totalAnalyses: number;
  totalTokens: number;
  avgLatency: number;
  lastAnalysisTime: Date | null;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}