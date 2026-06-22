//src/modules/portfolio_cv/ocr/contants/constant.ts
import type { OCRFeature } from "../interfaces/ocrInterfaces";

export const OCR_FEATURES: OCRFeature[] = [
  {
    title: "OCR Básico",
    description: "Extrae texto de imágenes usando Tesseract OCR",
    icon: "fa-file-lines",
    color: "#3B82F6",
    path: "/portfolio-cv/ocr/basic",
    features: [
      "Extracción de texto plano",
      "Soporte multi-idioma (ES/EN)",
      "Cálculo de confianza",
      "Conteo de palabras",
    ],
  },
  {
    title: "OCR con Preprocesamiento",
    description: "Mejora la calidad de imagen antes del OCR",
    icon: "fa-wand-magic-sparkles",
    color: "#8B5CF6",
    path: "/portfolio-cv/ocr/preprocess",
    features: [
      "Escala de grises",
      "Binarización",
      "Eliminación de ruido",
      "Corrección de inclinación",
      "Mejora para fondos complejos",
    ],
  },
  {
    title: "Extracción de Patrones",
    description: "Extrae emails, teléfonos, RUTs desde imágenes",
    icon: "fa-database",
    color: "#10B981",
    path: "/portfolio-cv/ocr/extract",
    features: [
      "Emails y teléfonos",
      "RUTs chilenos",
      "Fechas y URLs",
      "Imágenes PNG/JPG",
    ],
  },
  {
  title: "Extracción de Facturas",
  description: "Extrae datos de facturas PDF",
  icon: "fa-file-invoice-dollar",
  color: "#DC2626",
  path: "/portfolio-cv/ocr/invoice",
  features: [
    "PDFs estáticos",
    "Datos del emisor/receptor",
    "Totales y montos",
    "Sin upload de archivos",
  ],
},
  {
    title: "Comparación de Documentos",
    description: "Compara dos imágenes y detecta diferencias",
    icon: "fa-code-compare",
    color: "#F59E0B",
    path: "/portfolio-cv/ocr/compare",
    features: [
      "Puntaje de similitud",
      "Lista de diferencias",
      "Comparación línea por línea",
      "Detección de identidad",
    ],
  },
];