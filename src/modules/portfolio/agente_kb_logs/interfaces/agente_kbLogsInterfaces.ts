export interface QueryLog {
  id: number;
  example_id: string;
  user_id: number | null;
  query: string;
  response_source: "knowledge-base" | "plai-ai" | "error";
  response_text: string | null;
  prompt_used: string | null;  // ← AGREGAR ESTA LÍNEA
  ai_model_name: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  latency_ms: number | null;
  kb_matched: boolean;
  kb_priority: number | null;
  created_at: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total_records: number;
  total_pages: number;
}

export interface QueryLogsResponse {
  data: QueryLog[];
  pagination: Pagination;
  filters_applied: Record<string, any>;
}

export interface LogsFilters {
  start_date?: string;
  end_date?: string;
  source?: string;
  model?: string;
  search?: string;
  user_id?: number;
}