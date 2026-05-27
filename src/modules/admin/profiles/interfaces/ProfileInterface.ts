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

// ✅ Para módulos del perfil
export interface ModuleOption {
  id: number;
  name: string;
  slug: string;
}

export interface ProfileModulesResponse {
  profile_id: number;
  profile_name: string;
  modules: ModuleOption[];
  module_ids: number[];
}

// ✅ Para items de módulo
export interface ItemOption {
  id: number;
  name: string;
  code: string;
  description?: string | null;
}

export interface ProfileModuleItemsResponse {
  profile_id: number;
  module_id: number;
  module_name: string;
  items: ItemOption[];
  item_ids: number[];
  total_items: number;
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