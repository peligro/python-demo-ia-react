export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface TranslationRequest {
  text: string;
  source_lang?: string; // "auto" o código ISO
  target_lang: string;
  model?: string;
  tone?: "neutral" | "formal" | "casual";
}

export interface TranslationResponse {
  original_text: string;
  translated_text: string;
  source_lang_detected: string;
  target_lang: string;
  model_used: string;
  confidence?: number;
  metrics: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    latency_ms: number;
  };
  timestamp: string;
}

export interface TranslationHistoryItem {
  id: string;
  original_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  model: string;
  timestamp: string;
  tokens_used: number;
}

export interface SessionMetrics {
  totalTranslations: number;
  totalTokens: number;
  avgLatency: number;
  lastTranslationTime: Date | null;
}