// Tipos base del API
export interface UserItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  // ✅ Metadata anidada (como la retorna el backend)
  user_meta?: {
    id: number;
    phone: string | null;
    profile?: { id: number; name: string; description: string } | null;
    state?: { id: number; name: string } | null;
  } | null;
  // ✅ Campos directos para compatibilidad (opcional)
  state_id?: number | null;
  profile_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  state_id?: number | null;
  profile_id?: number | null;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  password?: string;
  phone?: string | null;
  state_id?: number | null;
  profile_id?: number | null;
}

export interface UserListResponse {
  total: number;
  page: number;
  limit: number;
  data: UserItem[];
}

// Tipos auxiliares para el formulario
export interface UserProfileOption {
  id: number;
  name: string;
  description: string;
}

export interface UserStateOption {
  id: number;
  name: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  confirm_password?: string;
  phone?: string | null;
  state_id?: number | null;
  profile_id?: number | null;
}

export interface UserFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  phone?: string;
  state_id?: string;
  profile_id?: string;
}