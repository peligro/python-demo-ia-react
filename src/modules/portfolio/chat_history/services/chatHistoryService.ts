import { api } from "../../../../common/api/api";
import type { 
  ChatHistoryRequest, 
  ChatHistoryResponse 
} from "../interfaces/chatHistoryInterfaces";

const BASE_URL = "/portfolio/chat-history";

export const chatHistoryService = {
  chat: async (data: ChatHistoryRequest): Promise<ChatHistoryResponse> => {
    const response = await api.post<ChatHistoryResponse>(`${BASE_URL}/chat`, data);
    return response.data;
  },
};