//src/modules/portfolio/face_detection/interfaces/face_detectionInterfaces.ts
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface EyeDetection {
  left_eye: BoundingBox | null;
  right_eye: BoundingBox | null;
  total_eyes_detected: number;
}

export interface FaceDetection {
  face_id: number;
  bounding_box: BoundingBox;
  eyes: EyeDetection;
}

export interface FaceDetectionRequest {
  image_path: string;
  method: "haarcascade";
  min_face_size?: number;
  scale_factor?: number;
  min_neighbors?: number;
}

export interface FaceDetectionResponse {
  image_path: string;
  method_used: string;
  total_faces_detected: number;
  faces: FaceDetection[];
  image_width: number;
  image_height: number;
  processing_time_ms: number;
  processed_image_url: string;
}