// Tipos base del API
export interface ModuleItem {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
  updated_at?: string;
}

export interface ModuleCreate {
  name: string;
  slug: string;
}

export interface ModuleUpdate {
  name?: string;
  slug?: string;
}

export interface ModuleListResponse {
  total: number;
  page: number;
  limit: number;
  data: ModuleItem[];
}

// Tipos auxiliares para el formulario
export interface ModuleFormData {
  name: string;
  slug: string;
}

export interface ModuleFormErrors {
  name?: string;
  slug?: string;
}