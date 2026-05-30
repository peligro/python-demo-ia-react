import { api } from "../../../../common/api/api";
import type { 
  GenerateSQLRequest, 
  GenerateSQLResponse 
} from "../interfaces/generateSqlInterfaces";

const BASE_URL = "/portfolio/generate-sql";

export const generateSqlService = {
  generate: async (data: GenerateSQLRequest): Promise<GenerateSQLResponse> => {
    const response = await api.post<GenerateSQLResponse>(`${BASE_URL}/generate`, data);
    return response.data;
  },
};