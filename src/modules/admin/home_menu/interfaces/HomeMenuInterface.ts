// Tipos base del API
export interface HomeMenuItem {
  id: number;
  title: string;
  icon: string;
  color: string;
  description: string;
  slug: string;
  order: number;
  module_id: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface HomeMenuCreate {
  title: string;
  icon: string;
  color: string;
  description: string;
  slug: string;
  order: number;
  module_id: number | null;
}

export interface HomeMenuUpdate {
  title?: string;
  icon?: string;
  color?: string;
  description?: string;
  slug?: string;
  order?: number;
  module_id?: number | null;
}

export interface HomeMenuListResponse {
  total: number;
  page: number;
  limit: number;
  data: HomeMenuItem[];
}

// Tipos auxiliares para el formulario
export interface HomeMenuFormData {
  title: string;
  icon: string;
  color: string;
  description: string;
  slug: string;
  order: number;
  module_id: number | null;
}

export interface HomeMenuFormErrors {
  title?: string;
  icon?: string;
  color?: string;
  description?: string;
  slug?: string;
  order?: string;
  module_id?: string;
}