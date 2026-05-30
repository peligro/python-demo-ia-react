export type AudioModel = "whisper-1" | "gemini-2.5-flash" | "gemini-2.0-flash";

export interface AudioTranscriptRequest {
  audio_path: string;
  model: AudioModel;
  language?: string;
}

export interface AudioTranscriptResponse {
  transcription: string;
  model_used: string;
  audio_duration_seconds?: number;
  detected_language?: string;
  metrics: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    latency_ms: number;
  };
  timestamp: string;
}

export interface SessionMetrics {
  totalTranscriptions: number;
  totalTokens: number;
  avgLatency: number;
  lastTranscriptionTime: Date | null;
}