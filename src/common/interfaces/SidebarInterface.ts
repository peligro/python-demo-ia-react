
import type { MenuItem } from "./MenuItemInterface";
import type { Module } from "./AuthContextType";

export interface SidebarProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    showMobileSidebar: boolean;
    setShowMobileSidebar: (show: boolean) => void;
    expandedMenu: string | null;
    setExpandedMenu: (menu: string | null) => void;
    activeSubItem: string;
    setActiveSubItem: (item: string) => void;
    currentPath: string;
    userModules: Module[];
}

// ✅ Interfaces locales limpias
export interface RenderMenuItemProps {
    item: MenuItem;
    isCollapsed: boolean;
    onCloseMobile?: () => void;
}