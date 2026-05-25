// Tipos base del API
export interface AppMenuItem {
  id: number;
  label: string;
  title: string;
  icon: string;
  order: number;
  parent_id: number | null;
  module_id: number | null;
  module_slug?: string | null;
  created_at?: string;
  updated_at?: string;
  parent?: { id: number; label: string } | null;
  module?: { id: number; name: string; slug: string } | null;
}

export interface AppMenuCreate {
  label: string;
  title: string;
  icon: string;
  order: number;
  parent_id: number | null;
  module_id: number | null;
}

export interface AppMenuUpdate {
  label?: string;
  title?: string;
  icon?: string;
  order?: number;
  parent_id?: number | null;
  module_id?: number | null;
}

export interface AppMenuListResponse {
  total: number;
  page: number;
  limit: number;
  data: AppMenuItem[];
}

// Tipos auxiliares para el formulario
export interface AppMenuParentOption {
  id: number;
  label: string;
}

export interface AppMenuModuleOption {
  id: number;
  name: string;
  slug: string;
}

export interface AppMenuFormData {
  label: string;
  title: string;
  icon: string;
  order: number;
  parent_id: number | null;
  module_id: number | null;
}

export interface AppMenuFormErrors {
  label?: string;
  title?: string;
  icon?: string;
  order?: string;
  module_id?: string;
}