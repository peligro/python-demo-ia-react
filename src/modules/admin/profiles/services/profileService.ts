import { api } from "../../../../common/api/api";
import type {
  ProfileItem,
  ProfileCreate,
  ProfileUpdate,
  ProfileListResponse,
  ProfileModulesResponse,
  ProfileModuleItemsResponse,
  ModuleOption,
  ItemOption,
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
    search: string = "",
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

  // ✅ MÉTODOS PARA MÓDULOS DEL PERFIL

  /**
   * GET /profiles/{id}/modules - Obtener módulos asignados
   */
  getModules: async (profileId: number): Promise<ProfileModulesResponse> => {
    const response = await api.get<ProfileModulesResponse>(
      `${BASE_URL}/${profileId}/modules`,
    );
    return response.data;
  },

  /**
   * PUT /profiles/{id}/modules - Sincronizar módulos (asignar/quitar masivamente)
   */
  syncModules: async (
    profileId: number,
    moduleIds: number[],
  ): Promise<ProfileModulesResponse> => {
    //console.log("🔄 syncModules:", { profileId, moduleIds }); // ← Debug

    const response = await api.put<ProfileModulesResponse>(
      `${BASE_URL}/${profileId}/modules`,
      {
        profile_id: profileId, // ← Backend lo espera
        profile_name: "", // ← No necesario, pero para cumplir con el schema
        modules: [], // ← No necesario, pero para cumplir con el schema
        module_ids: moduleIds, // ← Esto es lo que importa
      },
    );

    //console.log("✅ syncModules response:", response.data); // ← Debug
    return response.data;
  },

  /**
   * GET /profiles/{profileId}/modules/{moduleId}/items - Obtener items de un módulo
   */
  getModuleItems: async (
    profileId: number,
    moduleId: number,
  ): Promise<ProfileModuleItemsResponse> => {
    //console.log(`🔧 profileService.getModuleItems called:`, { profileId, moduleId });

    const url = `${BASE_URL}/${profileId}/modules/${moduleId}/items`;
    //console.log(`🌐 GET ${url}`);

    const response = await api.get<ProfileModuleItemsResponse>(url);

    //console.log(`✅ profileService.getModuleItems response:`, response.data);
    return response.data;
  },

  /**
   * POST /profiles/{profileId}/modules/{moduleId}/items - Asignar item
   */
  attachItem: async (
    profileId: number,
    moduleId: number,
    itemId: number,
  ): Promise<ItemOption> => {
    const response = await api.post<{ item: ItemOption }>(
      `${BASE_URL}/${profileId}/modules/${moduleId}/items`,
      { item_id: itemId },
    );
    return response.data.item;
  },

  /**
   * DELETE /profiles/{profileId}/modules/{moduleId}/items/{itemId} - Quitar item
   */
  detachItem: async (
    profileId: number,
    moduleId: number,
    itemId: number,
  ): Promise<void> => {
    await api.delete(
      `${BASE_URL}/${profileId}/modules/${moduleId}/items/${itemId}`,
    );
  },

  /**
   * GET /modules/all - Obtener todos los módulos disponibles (para select)
   */
  getAllModules: async (): Promise<ModuleOption[]> => {
    const response = await api.get<any>("/modules");

    // Si es array directo, retornarlo
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // Si es respuesta paginada, extraer el array 'data'
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }

    // Fallback: array vacío
    return [];
  },

  /**
   * GET /items - Obtener todos los items disponibles (para modal)
   */
  getAllItems: async (): Promise<ItemOption[]> => {
    const response = await api.get<ItemOption[]>("/items");
    return response.data;
  },
};
