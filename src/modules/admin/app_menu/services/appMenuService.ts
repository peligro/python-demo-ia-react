import { api } from "../../../../common/api/api";
import type {
  AppMenuItem,
  AppMenuCreate,
  AppMenuUpdate,
  AppMenuListResponse,
  AppMenuParentOption,
  AppMenuModuleOption,
} from "../interfaces/AppMenuInterface";

const BASE_URL = "/app-menu";

export const appMenuService = {
  /**
   * GET /app-menu - Listar con paginación
   */
  index: async (
    page: number = 1,
    limit: number = 20,
    search: string = ""
  ): Promise<AppMenuListResponse> => {
    const params: any = { page, limit };
    if (search) params.search = search;
    
    const response = await api.get<AppMenuListResponse>(BASE_URL, { params });
    return response.data;
  },

  /**
   * GET /app-menu/{id} - Obtener un menú por ID
   */
  show: async (id: number): Promise<AppMenuItem> => {
    const response = await api.get<AppMenuItem>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * POST /app-menu - Crear nuevo menú
   */
  store: async (data: AppMenuCreate): Promise<AppMenuItem> => {
    const response = await api.post<AppMenuItem>(BASE_URL, data);
    return response.data;
  },

  /**
   * PUT /app-menu/{id} - Actualizar menú existente
   */
  update: async (id: number, data: AppMenuUpdate): Promise<AppMenuItem> => {
    const response = await api.put<AppMenuItem>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /app-menu/{id} - Eliminar menú
   */
  destroy: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * GET /modules - Obtener módulos para el selector
   */
  getModules: async (): Promise<AppMenuModuleOption[]> => {
    const response = await api.get<AppMenuModuleOption[]>("/modules");
    return response.data;
  },

  /**
   * GET /app-menu/parents - Obtener menús padres para el selector
   */
  getParentMenus: async (): Promise<AppMenuParentOption[]> => {
    const response = await api.get<AppMenuParentOption[]>(`${BASE_URL}/parents`);
    return response.data;
  },
};