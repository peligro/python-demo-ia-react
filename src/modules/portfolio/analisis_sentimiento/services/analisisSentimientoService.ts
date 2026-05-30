import { api } from "../../../../common/api/api";
import type { 
  SentimentAnalysisRequest, 
  SentimentAnalysisResponse 
} from "../interfaces/analisisSentimientoInterfaces";

const BASE_URL = "/portfolio/analisis-de-sentimiento";

export const analisisSentimientoService = {
  analyze: async (data: SentimentAnalysisRequest): Promise<SentimentAnalysisResponse> => {
    const response = await api.post<SentimentAnalysisResponse>(`${BASE_URL}/analyze`, data);
    return response.data;
  },
  
  getHistory: async (limit: number = 20) => {
    const response = await api.get(`${BASE_URL}/history?limit=${limit}`);
    return response.data;
  },
};