export type SQLDialect = "postgresql" | "mysql" | "sqlite" | "mssql";

export interface ColumnInfo {
  name: string;
  type: string;
  description: string;
}

export interface TableSchema {
  table: string;
  columns: ColumnInfo[];
}

export interface GenerateSQLRequest {
  question: string;
  model?: string;
  dialect?: SQLDialect;
}

export interface GenerateSQLResponse {
  question: string;
  sql_query: string;
  explanation?: string;
  dialect: string;
  model_used: string;
  metrics: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    latency_ms: number;
  };
  timestamp: string;
  table_schema: TableSchema;
}

export interface SessionMetrics {
  totalGenerations: number;
  totalTokens: number;
  avgLatency: number;
  lastGenerationTime: Date | null;
}