
/**
 * Representa un módulo con sus permisos (items) que tiene asignado un usuario.
 * Se obtiene desde la API /api/app/me
 */
export interface Module {
  /** Nombre legible del módulo, ej: "Administración - Perfiles" */
  name: string;
  /** Slug de la ruta, ej: "//admin/perfiles" */
  slug: string;
  /** Lista de permisos (items) disponibles en este módulo */
  items: {
    /** ID del permiso en BD */
    id: number;
    /** Nombre legible, ej: "Acceso total de administrador" */
    name: string;
    /** Código único para validar en frontend, ej: "view_all_admin" */
    code: string;
  }[];
}

/**
 * Tipo del contexto de autenticación global de la aplicación.
 * Provee estado de sesión, datos del usuario y módulos/permisos.
 */
export interface AuthContextType {
  // Datos del usuario
  email: string;
  setEmail: (email: string) => void;
  
  fullName: string;
  setFullName: (name: string) => void;
  
  profile: string;
  setProfile: (profile: string) => void;
  
  profile_id: number;
  setProfileId: (profile_id: number) => void;

  // 👇 Módulos y permisos del usuario (desde /api/app/me)
  modules: Module[];
  setModules: (modules: Module[]) => void;

  // Estado de carga y autenticación
  loading: boolean;
  isAuthenticated: boolean;

  // Métodos de sesión
  validarSesion: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
}