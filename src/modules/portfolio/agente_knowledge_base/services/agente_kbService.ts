//src/modules/portfolio/agente_knowledge_base/services/agente_kbService.ts
import { api } from "../../../../common/api/api";
import type { QueryRequest, QueryResponse } from "../interfaces/agente_kbInterfaces";

const BASE_URL = "/portfolio/agente-kb";

export const agenteKBService = {
  /**
   * POST /portfolio/agente-kb/query
   * Consulta al agente de conocimiento base (KB + IA fallback)
   */
  query: async (data: QueryRequest): Promise<QueryResponse> => {
    const response = await api.post<QueryResponse>(`${BASE_URL}/query`, data);
    return response.data;
  },
};
