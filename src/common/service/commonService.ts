//src/common/service/commonService.ts
import { api } from "../api/api";
import type { AppMenuItem } from "../interfaces/AppMenuInterface";

export const getAppMenusApi = async (): Promise<AppMenuItem[]> => {
  const response = await api.get<AppMenuItem[]>("/app-menu/all");
  return response.data;
};