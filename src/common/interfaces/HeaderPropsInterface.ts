//src/common/interfaces/HeaderPropsInterface.ts
import type { UserResponse } from "../../modules/seguridad/interfaces/userInterfaces";

export interface HeaderProps {
  time: string;
  fechaTexto: string;
  setShowMobileSidebar: (show: boolean) => void;
  showLogoutConfirm: boolean;
  setShowLogoutConfirm: (show: boolean) => void;
  onConfirmLogout: () => void;
  user: UserResponse | null;
}
