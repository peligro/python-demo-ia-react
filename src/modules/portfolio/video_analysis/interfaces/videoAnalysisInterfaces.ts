//src/modules/portfolio/video_analysis/interfaces/videoAnalysisInterfaces.ts
export interface VideoAnalysisRequest {
  video_path: string;
  prompt?: string;
  model?: string;
}

export interface VideoAnalysisResponse {
  analysis: string;
  model_used: string;
  video_duration_seconds?: number;
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