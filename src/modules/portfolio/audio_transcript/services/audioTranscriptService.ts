import { api } from "../../../../common/api/api";
import type { 
  AudioTranscriptRequest, 
  AudioTranscriptResponse 
} from "../interfaces/audioTranscriptInterfaces";

const BASE_URL = "/portfolio/audio-transcript";

export const audioTranscriptService = {
  transcribe: async (data: AudioTranscriptRequest): Promise<AudioTranscriptResponse> => {
    const response = await api.post<AudioTranscriptResponse>(`${BASE_URL}/transcribe`, data);
    return response.data;
  },
};