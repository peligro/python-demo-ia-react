// Tipos base del API
export interface ProfileItem {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileCreate {
  name: string;
  description: string;
}

export interface ProfileUpdate {
  name?: string;
  description?: string;
}

export interface ProfileListResponse {
  total: number;
  page: number;
  limit: number;
  data: ProfileItem[];
}

// Tipos auxiliares para el formulario
export interface ProfileFormData {
  name: string;
  description: string;
}

export interface ProfileFormErrors {
  name?: string;
  description?: string;
}
