//src/modules/portfolio/face_detection/services/face_detectionService.ts
import { api } from "../../../../common/api/api";
import type {
  FaceDetectionRequest,
  FaceDetectionResponse,
} from "../interfaces/face_detectionInterfaces";

const BASE_URL = "/face-detection";

export const faceDetectionService = {
  /**
   * Detecta caras y ojos en una imagen
   */
  detectFaces: async (
    data: FaceDetectionRequest
  ): Promise<FaceDetectionResponse> => {
    const response = await api.post<FaceDetectionResponse>(
      `${BASE_URL}/detect`,
      data
    );
    return response.data;
  },
};
