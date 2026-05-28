import { api } from "../../../../common/api/api";
import type {
  ModuleItem,
  ModuleCreate,
  ModuleUpdate,
  ModuleListResponse,
} from "../interfaces/ModuleInterface";

const BASE_URL = "/modules";

export const moduleService = {
  /**
   * GET /modules - Listar con paginación y búsqueda
   */
  index: async (
    page: number = 1,
    limit: number = 20,
    search: string = ""
  ): Promise<ModuleListResponse> => {
    const params: any = { page, limit };
    if (search) params.search = search;
    
    const response = await api.get<ModuleListResponse>(BASE_URL, { params });
    return response.data;
  },

  /**
   * GET /modules/{id} - Obtener un módulo por ID
   */
  show: async (id: number): Promise<ModuleItem> => {
    const response = await api.get<ModuleItem>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * POST /modules - Crear nuevo módulo
   */
  store: async (data: ModuleCreate): Promise<ModuleItem> => {
    const response = await api.post<ModuleItem>(BASE_URL, data);
    return response.data;
  },

  /**
   * PUT /modules/{id} - Actualizar módulo existente
   */
  update: async (id: number, data: ModuleUpdate): Promise<ModuleItem> => {
    const response = await api.put<ModuleItem>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /modules/{id} - Eliminar módulo
   */
  destroy: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
