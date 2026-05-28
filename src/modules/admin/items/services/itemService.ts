import { api } from "../../../../common/api/api";
import type {
  ItemItem,
  ItemCreate,
  ItemUpdate,
  ItemListResponse,
} from "../interfaces/ItemInterface";

const BASE_URL = "/items";

export const itemService = {
  /**
   * GET /items - Listar con paginación y búsqueda
   */
  index: async (
    page: number = 1,
    limit: number = 20,
    search: string = ""
  ): Promise<ItemListResponse> => {
    const params: any = { page, limit };
    if (search) params.search = search;
    
    const response = await api.get<ItemListResponse>(BASE_URL, { params });
    return response.data;
  },

  /**
   * GET /items/{id} - Obtener un ítem por ID
   */
  show: async (id: number): Promise<ItemItem> => {
    const response = await api.get<ItemItem>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * POST /items - Crear nuevo ítem
   */
  store: async (data: ItemCreate): Promise<ItemItem> => {
    const response = await api.post<ItemItem>(BASE_URL, data);
    return response.data;
  },

  /**
   * PUT /items/{id} - Actualizar ítem existente
   */
  update: async (id: number, data: ItemUpdate): Promise<ItemItem> => {
    const response = await api.put<ItemItem>(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * DELETE /items/{id} - Eliminar ítem
   */
  destroy: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },
};
