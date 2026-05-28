// Tipos base del API
export interface ItemItem {
  id: number;
  name: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

export interface ItemCreate {
  name: string;
  code: string;
}

export interface ItemUpdate {
  name?: string;
  code?: string;
}

export interface ItemListResponse {
  total: number;
  page: number;
  limit: number;
  data: ItemItem[];
}

// Tipos auxiliares para el formulario
export interface ItemFormData {
  name: string;
  code: string;
}

export interface ItemFormErrors {
  name?: string;
  code?: string;
}
