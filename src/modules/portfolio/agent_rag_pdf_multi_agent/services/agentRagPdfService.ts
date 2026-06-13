// src/modules/portfolio/agent_rag_pdf_multi_agent/services/agentRagPdfService.ts
import { api } from "../../../../common/api/api";
import type {
  UploadResponse,
  RAGJob,
  JobChunksResponse,
  ListChunksParams,
  ListChunksResponse,
  RAGQueryResponse,
  QueueProvidersResponse,
} from "../interfaces/agentRagPdfInterfaces";

const BASE_URL = "/rag-pdf";

export interface ListJobsParams {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListJobsResponse {
  total: number;
  limit: number;
  offset: number;
  jobs: RAGJob[];
}

export const agentRagPdfService = {
  /**
   * Sube un archivo PDF y lo encola para procesamiento.
   */
  uploadPdf: async (
    file: File,
    queueProvider: string = "redis",
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<UploadResponse>(
      `${BASE_URL}/upload?queue_provider=${queueProvider}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  /**
   * Obtiene el estado actual de un job (para polling).
   */
  getJobStatus: async (jobId: number): Promise<RAGJob> => {
    const response = await api.get<RAGJob>(`${BASE_URL}/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Obtiene los chunks generados por un job específico (solo si está completado).
   */
  getJobChunks: async (jobId: number): Promise<JobChunksResponse> => {
    const response = await api.get<JobChunksResponse>(
      `${BASE_URL}/jobs/${jobId}/chunks`,
    );
    return response.data;
  },

  /**
   * Lista chunks con filtros opcionales (para la pestaña de Auditoría/Historial).
   */
  listChunks: async (
    params: ListChunksParams = {},
  ): Promise<ListChunksResponse> => {
    const response = await api.get<ListChunksResponse>(`${BASE_URL}/chunks`, {
      params,
    });
    return response.data;
  },

  /**
   * Realiza una consulta al motor RAG.
   * Nota: El backend espera 'query' como Query Parameter, no en el body.
   */
  queryRag: async (
    query: string,
    model: string = "mistral-small-latest",
    kbThreshold: number = 0.75,
    topK: number = 3,
  ): Promise<RAGQueryResponse> => {
    const response = await api.post<RAGQueryResponse>(`${BASE_URL}/query`, {
      query,
      model,
      kb_threshold: kbThreshold,
      top_k: topK,
    });
    return response.data;
  },

  /**
   * Obtiene el estado de los proveedores de cola configurados.
   */
  getQueueProviders: async (): Promise<QueueProvidersResponse> => {
    const response = await api.get<QueueProvidersResponse>(
      `${BASE_URL}/queue-providers`,
    );
    return response.data;
  },

  /**
   * Lista jobs procesados (para historial/auditoría).
   * Lista los PDFs subidos desde la carpeta archive/ del bucket S3.
   */
  listJobs: async (params: ListJobsParams = {}): Promise<ListJobsResponse> => {
    const response = await api.get<ListJobsResponse>(`${BASE_URL}/jobs`, {
      params,
    });
    return response.data;
  },
  /**
   * Genera URL pre-firmada temporal para descargar/ver el PDF.
   * La URL expira en 5 minutos.
   */
  getDownloadUrl: async (
    jobId: number,
  ): Promise<{
    job_id: number;
    filename: string;
    s3_key: string;
    download_url: string;
    expires_in_seconds: number;
  }> => {
    const response = await api.get(`${BASE_URL}/jobs/${jobId}/download`);
    return response.data;
  },
};
