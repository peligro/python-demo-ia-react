// services/imageRecognitionService.ts
import { api } from "../../../../common/api/api";
import type { 
  ImageRecognitionRequest, 
  ImageRecognitionResponse 
} from "../interfaces/imageRecognitionInterfaces";

const BASE_URL = "/portfolio/image-recognition";

export const imageRecognitionService = {
  analyze: async (data: ImageRecognitionRequest): Promise<ImageRecognitionResponse> => {
    const response = await api.post<ImageRecognitionResponse>(`${BASE_URL}/analyze`, data);
    return response.data;
  },
};