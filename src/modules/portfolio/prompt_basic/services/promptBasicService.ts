import { api } from "../../../../common/api/api";
import type { PromptBasicRequest, PromptBasicResponse } from "../interfaces/promptBasicInterfaces";

const BASE_URL = "/portfolio/prompt-basic";

export const promptBasicService = {
  query: async (data: PromptBasicRequest): Promise<PromptBasicResponse> => {
    const response = await api.post<PromptBasicResponse>(`${BASE_URL}/query`, data);
    return response.data;
  },
};
