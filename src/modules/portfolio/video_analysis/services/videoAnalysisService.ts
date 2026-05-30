import { api } from "../../../../common/api/api";
import type { 
  VideoAnalysisRequest, 
  VideoAnalysisResponse 
} from "../interfaces/videoAnalysisInterfaces";

const BASE_URL = "/portfolio/video-analysis";

export const videoAnalysisService = {
  analyze: async (data: VideoAnalysisRequest): Promise<VideoAnalysisResponse> => {
    const response = await api.post<VideoAnalysisResponse>(`${BASE_URL}/analyze`, data);
    return response.data;
  },
};