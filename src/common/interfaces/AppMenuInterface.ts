//src/interfaces/AppMenuItemInterface.ts
export interface AppMenuItem {
  id: number;
  label: string;
  title: string;
  icon: string;
  order: number;
  parent_id: number | null;
  module_id: number | null;
  
  // ✅ Ambos campos: slug para estáticos, module_slug para dinámicos
  slug?: string | null;           // Para menús estáticos (Inicio, Ayuda)
  module_slug?: string | null;    // Para menús dinámicos (desde API)
  
  created_at?: string;
  updated_at?: string;
}