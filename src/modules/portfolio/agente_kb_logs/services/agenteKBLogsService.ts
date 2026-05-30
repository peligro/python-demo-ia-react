import { api } from "../../../../common/api/api";
import type { QueryLogsResponse, LogsFilters } from "../interfaces/agente_kbLogsInterfaces";

const BASE_URL = "/portfolio/agente-kb";

export const agenteKBLogsService = {
  /**
   * GET /portfolio/agente-kb/logs
   * Obtener logs con filtros y paginación
   */
  getLogs: async (
    filters: LogsFilters = {},
    page: number = 1,
    per_page: number = 20
  ): Promise<QueryLogsResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });

    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.source) params.append("source", filters.source);
    if (filters.model) params.append("model", filters.model);
    if (filters.search) params.append("search", filters.search);
    if (filters.user_id) params.append("user_id", filters.user_id.toString());

    const response = await api.get<QueryLogsResponse>(`${BASE_URL}/logs?${params}`);
    return response.data;
  },
};