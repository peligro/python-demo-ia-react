//src/modules/admin/users/services/userService.ts
import { api } from "../../../../common/api/api";
import type {
  UserItem,
  UserCreate,
  UserUpdate,
  UserListResponse,
  UserProfileOption,
  UserStateOption,
} from "../interfaces/UserInterface";

const BASE_URL = "/users";

export const userService = {
  /**
   * GET /users - Listar con paginación y búsqueda
   */
  index: async (
    page: number = 1,
    limit: number = 20,
    search: string = ""
  ): Promise<UserListResponse> => {
    const params: any = { page, limit };
    if (search) {
      params.name = search;
    }
    
    const response = await api.get<UserListResponse>(BASE_URL, { params });
    return response.data;
  },

  /**
   * GET /users/{id} - Obtener un usuario por ID
   */
  show: async (id: number): Promise<UserItem> => {
    const response = await api.get<UserItem>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * POST /users - Crear nuevo usuario
   */
  store: async (data: UserCreate): Promise<UserItem> => {
    const response = await api.post<UserItem>(BASE_URL, data);
    return response.data;
  },

  /**
   * PUT /users/{id} - Actualizar usuario existente
   */
  update: async (id: number, data: UserUpdate): Promise<UserItem> => {
    const response = await api.put<UserItem>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /users/{id} - Eliminar usuario
   */
  destroy: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * ✅ GET /profiles/all - Obtener perfiles para el selector (sin paginación)
   */
  getProfiles: async (): Promise<UserProfileOption[]> => {
    const response = await api.get<UserProfileOption[]>("/profiles/all");  // ✅ Cambiado de /profiles a /profiles/all
    return response.data;
  },

  /**
   * GET /states - Obtener estados para el selector
   */
  getStates: async (): Promise<UserStateOption[]> => {
    const response = await api.get<UserStateOption[]>("/states");
    return response.data;
  },
};