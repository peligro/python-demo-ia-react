import { useNavigate } from "react-router-dom";

interface AdminCard {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  badge?: string;
}

const AdminHome = () => {
  const navigate = useNavigate();

  const cards: AdminCard[] = [
    {
      title: "Módulos",
      description: "Gestionar módulos del sistema",
      icon: "fa-th-large",
      href: "/admin/modulos",
      color: "#3B82F6", // blue
      badge: "Core",
    },
    {
      title: "Perfiles",
      description: "Gestionar perfiles de usuario",
      icon: "fa-id-card",
      href: "/admin/perfiles",
      color: "#10B981", // green
      badge: "Core",
    },
    {
      title: "Ítems",
      description: "Gestionar items de permisos",
      icon: "fa-shield-alt",
      href: "/admin/items",
      color: "#F59E0B", // amber
    },
    {
      title: "Usuarios",
      description: "Gestionar usuarios del sistema",
      icon: "fa-users",
      href: "/admin/usuarios",
      color: "#8B5CF6", // purple
    },
    {
      title: "Menús de Aplicación",
      description: "Configurar menús del sidebar",
      icon: "fa-list-ul",
      href: "/admin/app-menu",
      color: "#EC4899", // pink
    },
    {
      title: "Home Menú",
      description: "Configurar cajas del home",
      icon: "fa-home",
      href: "/admin/home-menu",
      color: "#14B8A6", // teal
    },
  ];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">
            <i className="fas fa-cog me-2 text-primary"></i>
            Panel de Administración
          </h1>
          <p className="text-muted mb-0">Gestiona todos los componentes del sistema</p>
        </div>
      </div>

      <div className="row g-4 mb-5">
        {cards.map((card, index) => (
          <div key={index} className="col-lg-4 col-md-6">
            <a
              href={card.href}
              className="text-decoration-none"
              onClick={(e) => {
                e.preventDefault();
                navigate(card.href);
              }}
              title={card.title}
            >
              <div
                className="card card-module h-100 border-0 shadow-sm hover-lift"
                style={{
                  borderTop: `4px solid ${card.color}`,
                  transition: "all 0.3s ease",
                }}
              >
                <div className="card-body text-center p-4">
                  <div
                    className="icon-circle mb-3 mx-auto d-flex align-items-center justify-content-center"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      backgroundColor: `${card.color}20`,
                      color: card.color,
                    }}
                  >
                    <i className={`fas ${card.icon} fs-2`}></i>
                  </div>
                  <h5 className="card-title fw-bold mb-2">{card.title}</h5>
                  <p className="card-text text-muted small mb-3">
                    {card.description}
                  </p>
                  {card.badge && (
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${card.color}20`,
                        color: card.color,
                      }}
                    >
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
            </a>
          </div>
        ))}
      </div>

       
    </>
  );
};

export default AdminHome;