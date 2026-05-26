import { api } from "../../../common/api/api";
import type { LoginRequest, UserResponse } from "../interfaces/userInterfaces";



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