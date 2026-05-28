import { api } from "../../../../common/api/api";
import type {
  HomeMenuItem,
  HomeMenuCreate,
  HomeMenuUpdate,
  HomeMenuListResponse,
} from "../interfaces/HomeMenuInterface";


const BASE_URL = "/home-menu";

export const homeMenuService = {
  /**
   * GET /home-menu - Listar con paginación
   */
  index: async (
    page: number = 1,
    limit: number = 20,
  ): Promise<HomeMenuListResponse> => {
    const params: any = { page, limit };
    
    const response = await api.get<HomeMenuListResponse>(BASE_URL, { params });
    return response.data;
  },

  /**
   * GET /home-menu/all - Listar todos (para selects)
   */
  getAll: async (): Promise<HomeMenuItem[]> => {
    const response = await api.get<HomeMenuItem[]>(`${BASE_URL}/all`);
    return response.data;
  },

  /**
   * GET /home-menu/{id} - Obtener por ID
   */
  show: async (id: number): Promise<HomeMenuItem> => {
    const response = await api.get<HomeMenuItem>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * POST /home-menu - Crear
   */
  store: async (data: HomeMenuCreate): Promise<HomeMenuItem> => {
    const response = await api.post<HomeMenuItem>(BASE_URL, data);
    return response.data;
  },

  /**
   * PUT /home-menu/{id} - Actualizar
   */
  update: async (id: number, data: HomeMenuUpdate): Promise<HomeMenuItem> => {
    const response = await api.put<HomeMenuItem>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /home-menu/{id} - Eliminar
   */
  destroy: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};