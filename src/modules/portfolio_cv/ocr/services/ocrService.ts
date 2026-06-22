//src/modules/portfolio_cv/ocr/services/ocrService.ts
import { api } from "../../../../common/api/api";
import type {
  OCRBasicRequest,
  OCRBasicResponse,
  OCRPreprocessRequest,
  OCRPreprocessResponse,
  CompareDocumentsRequest,
  CompareDocumentsResponse,
} from "../interfaces/ocrInterfaces";

const BASE_URL = "/ocr";

export const ocrService = {
  basic: async (data: OCRBasicRequest): Promise<OCRBasicResponse> => {
    const response = await api.post<OCRBasicResponse>(`${BASE_URL}/basic`, data);
    return response.data;
  },

  preprocess: async (data: OCRPreprocessRequest): Promise<OCRPreprocessResponse> => {
    const response = await api.post<OCRPreprocessResponse>(`${BASE_URL}/preprocess`, data);
    return response.data;
  },

  // ✅ CORREGIDO: Usa BASE_URL y la ruta "/extract" que espera tu backend
  async extract(data: {
    image_path: string;
    language: "spa" | "eng" | "spa+eng";
    extract_patterns: string[];
  }) {
    const response = await api.post(`${BASE_URL}/extract`, data);
    return response.data;
  },

  compare: async (data: CompareDocumentsRequest): Promise<CompareDocumentsResponse> => {
    const response = await api.post<CompareDocumentsResponse>(`${BASE_URL}/compare`, data);
    return response.data;
  },

  async extractInvoice(formData: FormData) {
    const response = await api.post(`${BASE_URL}/extract-invoice`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ✅ CORREGIDO: El backend espera 'file_path', no 'pdf_path'
  async extractInvoiceFromStaticPDF(pdfPath: string) {
    const response = await api.post(`${BASE_URL}/extract-invoice-static`, {
      file_path: pdfPath 
    });
    return response.data;
  },
};