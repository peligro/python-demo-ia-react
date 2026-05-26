import { api } from "../../../../common/api/api";
import type {
  ProfileItem,
  ProfileCreate,
  ProfileUpdate,
  ProfileListResponse,
} from "../interfaces/ProfileInterface";

const BASE_URL = "/profiles";

export const profileService = {
  /**
   * GET /profiles/all - Listar todos los perfiles (para select de usuarios)
   */
  getAll: async (): Promise<ProfileItem[]> => {
    const response = await api.get<ProfileItem[]>(`${BASE_URL}/all`);
    return response.data;
  },

  /**
   * GET /profiles - Listar con paginación y búsqueda (para mantenedor)
   */
  index: async (
    page: number = 1,
    limit: number = 20,
    search: string = ""
  ): Promise<ProfileListResponse> => {
    const params: any = { page, limit };
    if (search) params.search = search;
    
    const response = await api.get<ProfileListResponse>(BASE_URL, { params });
    return response.data;
  },

  /**
   * GET /profiles/{id} - Obtener un perfil por ID
   */
  show: async (id: number): Promise<ProfileItem> => {
    const response = await api.get<ProfileItem>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * POST /profiles - Crear nuevo perfil
   */
  store: async (data: ProfileCreate): Promise<ProfileItem> => {
    const response = await api.post<ProfileItem>(BASE_URL, data);
    return response.data;
  },

  /**
   * PUT /profiles/{id} - Actualizar perfil existente
   */
  update: async (id: number, data: ProfileUpdate): Promise<ProfileItem> => {
    const response = await api.put<ProfileItem>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /profiles/{id} - Eliminar perfil
   */
  destroy: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
