//src/components/Sidebar.tsx
import { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import type { AppMenuItem } from "../common/interfaces/AppMenuInterface";
import { getAppMenusApi } from "../common/service/commonService";

interface SidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  showMobileSidebar: boolean;
  setShowMobileSidebar: (show: boolean) => void;
}

// Menús estáticos (siempre visibles) - con slug
const staticMenuItems: AppMenuItem[] = [
  {
    id: 1000,
    label: "Inicio",
    title: "Página principal",
    icon: "fa-home",
    order: 0,
    parent_id: null,
    module_id: null,
    slug: "/",
  },
  {
    id: 1001,
    label: "Ayuda",
    title: "Ayuda y soporte",
    icon: "fa-question-circle",
    order: 99,
    parent_id: null,
    module_id: null,
    slug: "/help",
  },
];

interface MenuItemWithChildren extends AppMenuItem {
  children?: MenuItemWithChildren[];
}

// Helper para obtener el slug de un menú (estático o dinámico)
const getMenuSlug = (item: AppMenuItem): string => {
  return item.slug || item.module_slug || "#";
};

const Sidebar: React.FC<SidebarProps> = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  showMobileSidebar,
  setShowMobileSidebar,
}) => {
  const location = useLocation();
  const auth = useContext(AuthContext);

  const [menuItems, setMenuItems] = useState<MenuItemWithChildren[]>([]);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar menús desde API
  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoading(true);
        const menus = await getAppMenusApi();

        // Combinar menús estáticos + dinámicos
        const allMenus = [...staticMenuItems, ...menus];

        // Construir jerarquía (padres -> hijos)
        const hierarchicalMenus = buildMenuHierarchy(allMenus);

        setMenuItems(hierarchicalMenus);
      } catch (error) {
        console.error("Error al cargar menús:", error);
        // Fallback: mostrar solo menús estáticos
        setMenuItems(buildMenuHierarchy(staticMenuItems));
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, []);

  // Expandir menú automáticamente según la ruta actual
  useEffect(() => {
    menuItems.forEach((item) => {
      const itemSlug = getMenuSlug(item);
      if (
        item.children?.some((child) => {
          const childSlug = getMenuSlug(child);
          return location.pathname.startsWith(childSlug);
        })
      ) {
        setExpandedMenu(item.label);
      }
    });
  }, [location.pathname, menuItems]);

  // Construir jerarquía de menús (padres -> hijos)
  const buildMenuHierarchy = (items: AppMenuItem[]): MenuItemWithChildren[] => {
    const menuMap = new Map<number, MenuItemWithChildren>();
    const roots: MenuItemWithChildren[] = [];

    // Crear mapa de todos los items
    items.forEach((item) => {
      menuMap.set(item.id, { ...item, children: [] } as MenuItemWithChildren);
    });

    // Construir jerarquía
    items.forEach((item) => {
      const menuItem = menuMap.get(item.id)!;

      if (item.parent_id === null) {
        // Es un menú raíz
        roots.push(menuItem);
      } else {
        // Es un hijo, agregarlo al padre
        const parent = menuMap.get(item.parent_id);
        if (parent) {
          parent.children!.push(menuItem);
        }
      }
    });

    // Ordenar por 'order'
    roots.sort((a, b) => a.order - b.order);
    roots.forEach((root) => {
      root.children?.sort((a, b) => a.order - b.order);
    });

    return roots;
  };

  const toggleMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const isActivePath = (path: string) => {
    return (
      path !== "#" &&
      (location.pathname === path || location.pathname.startsWith(path + "/"))
    );
  };

  const getMenuKey = (label: string): string => {
    return label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const renderMenuItem = (item: MenuItemWithChildren, isMobile = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenu === item.label;
    const itemSlug = getMenuSlug(item);
    const isActive = isActivePath(itemSlug);

    if (hasChildren) {
      return (
        <div key={item.id} className="sidebar-group">
          <button
            onClick={() => toggleMenu(item.label)}
            className={`sidebar-item w-100 px-3 py-2 rounded ${
              isExpanded || isActive ? "active" : ""
            } ${isExpanded ? "sidebar-item-expanded" : ""}`}
            title={item.label}
            aria-expanded={isExpanded}
          >
            <div className="d-flex align-items-center gap-3">
              <i
                className={`fas ${item.icon} fs-6`}
                style={{ width: "20px", flexShrink: 0 }}
              ></i>
              {!sidebarCollapsed && (
                <span className="fw-medium">{item.label}</span>
              )}
            </div>
            {!sidebarCollapsed && (
              <i
                className={`fas fa-chevron-${isExpanded ? "up" : "down"} fs-6`}
              ></i>
            )}
          </button>

          {!sidebarCollapsed && isExpanded && (
            <div className="ms-4 mt-1 d-flex flex-column gap-1">
              {item.children?.map((child) => {
                const childSlug = getMenuSlug(child);
                return (
                  <Link
                    key={child.id}
                    to={childSlug}
                    onClick={() => isMobile && setShowMobileSidebar(false)}
                    className={`sidebar-subitem px-3 py-2 rounded ${isActivePath(childSlug) ? "active" : ""}`}
                    title={child.title || child.label}
                  >
                    <i
                      className={`fas ${child.icon || "fa-circle"} fs-6`}
                      style={{ fontSize: "14px", width: "20px", flexShrink: 0 }}
                    ></i>
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        to={itemSlug}
        onClick={() => isMobile && setShowMobileSidebar(false)}
        className={`sidebar-item px-3 py-2 rounded ${isActive ? "active" : ""}`}
        title={item.title || item.label}
      >
        <div className="d-flex align-items-center gap-3">
          <i
            className={`fas ${item.icon} fs-6`}
            style={{ width: "20px", flexShrink: 0 }}
          ></i>
          {!sidebarCollapsed && <span>{item.label}</span>}
        </div>
      </Link>
    );
  };

  // Loading state
  if (loading) {
    return (
      <aside
        className={`bg-sidebar-700 text-white d-none d-md-flex flex-column position-relative justify-content-center align-items-center`}
        style={{
          width: sidebarCollapsed ? "70px" : "260px",
          minHeight: "200px",
        }}
      >
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Cargando menú...</span>
        </div>
      </aside>
    );
  }

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside
      className={`bg-sidebar-700 text-white d-none d-md-flex flex-column position-relative`}
      style={{
        width: sidebarCollapsed ? "70px" : "260px",
        transition: "width 0.3s ease",
        flexShrink: 0,
        minWidth: "70px",
      }}
    >
      <button
        className="position-absolute btn btn-sm btn-sidebar-light rounded-circle shadow"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        style={{
          right: "-12px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 100,
          width: "32px",
          height: "32px",
          padding: "0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid rgba(255,255,255,0.3)",
        }}
        title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
      >
        <i
          className={`fas fa-${sidebarCollapsed ? "chevron-right" : "chevron-left"} fs-6`}
        ></i>
      </button>

      <div className="d-flex flex-column gap-1 p-3 overflow-auto custom-scrollbar flex-grow-1">
        {menuItems.map((item) => renderMenuItem(item))}
      </div>
    </aside>
  );

  // Mobile Sidebar
  const MobileSidebar = () => (
    <>
      {showMobileSidebar && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
      <div
        className={`offcanvas offcanvas-start bg-sidebar-700 text-white show`}
        tabIndex={-1}
        style={{
          display: showMobileSidebar ? "block" : "none",
          zIndex: 1050,
          width: "260px",
        }}
      >
        <div className="offcanvas-header border-bottom border-white-10">
          <h5 className="offcanvas-title fw-bold">Menú Tamila</h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowMobileSidebar(false)}
          />
        </div>
        <div className="offcanvas-body d-flex flex-column gap-2">
          {menuItems.map((item) => renderMenuItem(item, true))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

export default Sidebar;
