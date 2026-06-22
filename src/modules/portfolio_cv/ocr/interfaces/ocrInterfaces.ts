//src/modules/portfolio_cv/ocr/interfaces/ocrInterfaces.ts
// ============================================================================
// OCR BÁSICO
// ============================================================================
export interface OCRBasicRequest {
  image_path: string;
  language: "spa" | "eng" | "spa+eng";
}
export interface OCRFeature {
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
  features: string[];
}

export interface OCRBasicResponse {
  image_path: string;
  extracted_text: string;
  language_used: string;
  confidence: number;
  word_count: number;
  processing_time_ms: number;
  timestamp: string;
}

// ============================================================================
// OCR CON PREPROCESAMIENTO
// ============================================================================
export interface OCRPreprocessRequest {
  image_path: string;
  language: "spa" | "eng" | "spa+eng";
  preprocessing: "auto" | "grayscale" | "binarize" | "denoise" | "deskew" | "enhance"; // ← AGREGAR "enhance"
}

export interface OCRPreprocessResponse {
  image_path: string;
  preprocessing_applied: string;
  extracted_text: string;
  language_used: string;
  confidence: number;
  word_count: number;
  processing_time_ms: number;
  preprocessed_image_url: string | null;
  timestamp: string;
}

// ============================================================================
// EXTRACCIÓN DE DATOS
// ============================================================================
export type ExtractPattern = "email" | "phone" | "rut" | "date" | "url";

export interface ExtractDataRequest {
  image_path: string;
  language: "spa" | "eng" | "spa+eng";
  extract_patterns: ExtractPattern[];
}

export interface ExtractedData {
  emails: string[];
  phones: string[];
  ruts: string[];
  dates: string[];
  urls: string[];
}

export interface ExtractDataResponse {
  image_path: string;
  extracted_data: ExtractedData;
  raw_text: string;
  language_used: string;
  processing_time_ms: number;
  timestamp: string;
}

// ============================================================================
// COMPARACIÓN DE DOCUMENTOS
// ============================================================================
export interface CompareDocumentsRequest {
  image_path_1: string;
  image_path_2: string;
  language: "spa" | "eng" | "spa+eng";
}

export interface CompareDocumentsResponse {
  image_path_1: string;
  image_path_2: string;
  text_1: string;
  text_2: string;
  similarity_score: number;
  differences: string[];
  are_identical: boolean;
  processing_time_ms: number;
  timestamp: string;
}

// ============================================================================
// IMÁGENES ESTÁTICAS (compartidas entre todas las páginas)
// ============================================================================
export interface StaticImage {
  path: string;
  label: string;
}

export interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  ruc_emitter: string | null;
  emitter_name: string | null;
  emitter_address: string | null;
  ruc_client: string | null;
  client_name: string | null;
  client_address: string | null;
  subtotal: number;
  tax: number;
  total: number;
  items: any[];
}
export interface InvoiceResponse {
  file_path: string;
  invoice_data: InvoiceData;
  raw_text: string;
  processing_time_ms: number;
  timestamp: string;
}
export interface InvoiceItem {
  codigo?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  monto_total: number;
}

export interface InvoiceExtractResponse {
  invoice_data: InvoiceData;
  raw_text: string;
  confidence: number;
  processing_time_ms: number;
  pages_processed: number;
}