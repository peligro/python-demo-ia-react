import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AlertCustom from "../common/ui/AlertCustom";
import type { UserResponse } from "../modules/seguridad/services/authService";

interface HeaderProps {
  time: string;
  fechaTexto: string;
  setShowMobileSidebar: (show: boolean) => void;
  showLogoutConfirm: boolean;
  setShowLogoutConfirm: (show: boolean) => void;
  onConfirmLogout: () => void;
  user: UserResponse | null;
}

const Header: React.FC<HeaderProps> = ({
  time,
  fechaTexto,
  setShowMobileSidebar,
  showLogoutConfirm,
  setShowLogoutConfirm,
  onConfirmLogout,
  user,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
   // Referencia al dropdown
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Cerrar menú de usuario si se hace clic fuera
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      
      // Cerrar notificaciones si se hace clic fuera
      const notifWrapper = document.querySelector('.notifications-wrapper');
      if (notifWrapper && !notifWrapper.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  const notifications = [
    {
      id: 1,
      title: "Nueva cita",
      message: "Juan Pérez agendó para mañana",
      time: "Hace 5 min",
      unread: true,
    },
    {
      id: 2,
      title: "Pago recibido",
      message: "$50.000 de María González",
      time: "Hace 1 hora",
      unread: true,
    },
  ];
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUserMenu(false);
    setShowLogoutConfirm(true);
  };

  return (
    <>
      <nav
        className="navbar navbar-expand-lg navbar-dark bg-navbar-gradient shadow-sm"
        style={{ flexShrink: 0 }}
      >
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center justify-content-between w-100">
            {/* Logo + Mobile Toggle */}
            <div className="d-flex align-items-center">
              <button
                className="navbar-toggler border-0 text-white p-0 d-md-none me-2"
                type="button"
                onClick={() => setShowMobileSidebar(true)}
                aria-label="Abrir menú"
              >
                <i className="fas fa-bars fs-5"></i>
              </button>
              <Link
                className="navbar-brand text-white fs-5 d-flex align-items-center"
                to="/"
              >
                <img
                  src="https://www.cesarcancino.com/wp-content/themes/cesarcancino/assets/img/logo.jpg"
                  alt="Tamila"
                  height="44"
                  className="rounded me-2"
                />
                <span className="fw-bold d-none d-sm-inline">TAMILA</span>
              </Link>
            </div>

            {/* Right Side */}
            <div className="d-flex align-items-center">
              {/* Date/Time - Desktop only */}
              <div className="d-none d-md-flex align-items-center me-3 text-white">
                <span className="text-white-50">{fechaTexto} | </span>
                <span className="fw-bold">{time}</span>
              </div>

              {/* Notifications */}
              <div className="notifications-wrapper me-3">
                <button
                  className="notifications-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                  aria-label="Notificaciones"
                >
                  <i className="fas fa-bell fs-5"></i>
                  {unreadCount > 0 && (
                    <span className="badge rounded-pill bg-danger">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="notifications-panel">
                    <div className="notifications-panel-header">
                      <h6>
                        Notificaciones{" "}
                        <span className="text-muted ms-1">
                          ({unreadCount} nuevas)
                        </span>
                      </h6>
                    </div>
                    <div className="notifications-panel-list">
                      {notifications.map((notif) => (
                        <a
                          key={notif.id}
                          href="#"
                          className={`notification-row ${notif.unread ? "unread" : ""}`}
                          onClick={(e) => e.preventDefault()}
                        >
                          <div className="notification-row-title">
                            {notif.title}
                          </div>
                          <p className="notification-row-message">
                            {notif.message}
                          </p>
                          <div className="notification-row-time">
                            {notif.time}
                          </div>
                        </a>
                      ))}
                    </div>
                    <div className="notifications-panel-footer">
                      <button type="button">
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div
                className="dropdown position-relative"
                onClick={(e) => e.stopPropagation()}
                ref={userMenuRef} 
              >
                <button
                  className="btn btn-link text-white p-0 d-flex align-items-center gap-2"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                  aria-label="Menú de usuario"
                  aria-expanded={showUserMenu}
                >
                  <div className="d-none d-md-flex align-items-center">
                    <span className="text-white-50 small me-1">¡Hola,</span>
                    <span className="text-white fw-bold small">
                      {user?.name || "Usuario"}
                    </span>
                  </div>
                  <div
                    className="bg-sidebar-500 rounded-circle d-flex align-items-center justify-content-center text-white"
                    style={{ width: "36px", height: "36px", minWidth: "36px" }}
                  >
                    <i className="fas fa-user-circle"></i>
                  </div>
                </button>
                {showUserMenu && (
                  <div className="dropdown-menu dropdown-menu-end shadow border-0 show user-dropdown-menu">
                    <div className="px-3 py-2 border-bottom">
                      <div
                        className="text-truncate"
                        title={user?.name || "Usuario"}
                      >
                        <strong className="d-block text-truncate">
                          <i className="fas fa-user-circle me-2"></i>
                          {user?.profile?.name || "Perfil"}
                        </strong>
                        <small className="text-muted d-block">
                          {user?.name || "Usuario"}
                        </small>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        className="dropdown-item text-danger rounded d-flex align-items-center w-100 border-0 bg-transparent text-start"
                        onClick={handleLogoutClick}
                        type="button"
                      >
                        <i className="fas fa-sign-out-alt me-2"></i>
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation */}
      <AlertCustom
        estado={showLogoutConfirm}
        titulo="¿Cerrar sesión?"
        detalle="¿Estás seguro de que deseas cerrar tu sesión actual?"
        headerBg="bg-warning"
        esConfirm={true}
        confirmText="Sí, cerrar sesión"
        cancelText="Cancelar"
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={onConfirmLogout}
      />
    </>
  );
};

export default Header;
