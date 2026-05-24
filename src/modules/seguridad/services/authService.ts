import { api } from "../../../common/api/api";

// ✅ Interfaces alineadas con FastAPI
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  metadata?: {
    id: number;
    phone: string | null;
    state_id: number | null;
    profile_id: number | null;
  };
  profile?: { id: number; name: string; description: string } | null;
  state?: { id: number; name: string } | null;
  modules?: Array<{
    id: number;
    name: string;
    slug: string;
    items: Array<{ id: number; name: string; code: string }>;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

// ✅ POST /auth/login
export const loginApi = async (credentials: LoginRequest): Promise<UserResponse> => {
  const response = await api.post<{ status: string; message: string; user: UserResponse }>("/auth/login", credentials);
  return response.data.user;
};

// ✅ GET /auth/me
export const getMeApi = async (): Promise<UserResponse> => {
  const response = await api.get<UserResponse>("/auth/me");
  return response.data;
};

// ✅ POST /auth/logout
export const logoutApi = async (): Promise<{ status: string; message: string }> => {
  const response = await api.post<{ status: string; message: string }>("/auth/logout");
  return response.data;
};