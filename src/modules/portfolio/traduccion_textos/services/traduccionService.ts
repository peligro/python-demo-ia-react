import { api } from "../../../../common/api/api";
import type { TranslationRequest, TranslationResponse, Language } from "../interfaces/traduccionInterfaces";

const BASE_URL = "/portfolio/traduccion-textos";

export const traduccionService = {
  translate: async (data: TranslationRequest): Promise<TranslationResponse> => {
    const response = await api.post<TranslationResponse>(`${BASE_URL}/translate`, data);
    return response.data;
  },
  
  getLanguages: async (): Promise<Language[]> => {
    const response = await api.get<Language[]>(`${BASE_URL}/languages`);
    return response.data;
  },
  
  getHistory: async (limit: number = 20) => {
    const response = await api.get(`${BASE_URL}/history?limit=${limit}`);
    return response.data;
  },
};
