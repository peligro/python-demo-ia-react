//src/modules/home/pages/Home.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Container, Row, Col, Spinner } from "react-bootstrap";
import { homeMenuService } from "../../admin/home_menu/services/homeMenuService";
import type { HomeMenuItem } from "../../admin/home_menu/interfaces/HomeMenuInterface";

// ✅ Configuración de Accesos Rápidos con estilos personalizados
const QUICK_ACCESS_CONFIG = [
  {
    title: "www.cesarcancino.com",
    url: "https://www.cesarcancino.com",
    icon: "fas fa-globe",
    color: "#3B82F6", // Azul
    gradient: "linear-gradient(135deg, #3B82F6, #6366F1)",
    description: "Visitar mi sitio web personal",
  },
  {
    title: "Ebook Desarrollo para IA",
    url: "https://ai-ebook.cesarcancino.com/intro",
    icon: "fas fa-book-open",
    color: "#10B981", // Verde esmeralda
    gradient: "linear-gradient(135deg, #10B981, #14B8A6)",
    description: "Guía práctica de desarrollo para inteligencia artificial",
  },
  {
    title: "Curso APIs de IA",
    url: "https://integracion-de-apis-de-ia-de-cero-a-experto.cesarcancino.com/",
    icon: "fas fa-robot",
    color: "#8B5CF6", // Violeta
    gradient: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
    description: "Integración de APIs de IA de Cero a Experto",
  },
  {
    title: "GitHub",
    url: "https://github.com/peligro",
    icon: "fab fa-github-alt",
    color: "#64748B", // Gris azulado
    gradient: "linear-gradient(135deg, #64748B, #94A3B8)",
    description: "Mis proyectos de código abierto",
  },
  {
    title: "LinkedIn",
    url: "https://www.linkedin.com/in/cesarcancino",
    icon: "fab fa-linkedin-in",
    color: "#0A66C2", // Azul LinkedIn
    gradient: "linear-gradient(135deg, #0A66C2, #0077B5)",
    description: "Conecta conmigo profesionalmente",
  },
];

const Home = () => {
  const [homeMenus, setHomeMenus] = useState<HomeMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHomeMenus = async () => {
      try {
        setLoading(true);
        const data = await homeMenuService.getAll();
        const sorted = [...data].sort((a, b) => a.order - b.order);
        setHomeMenus(sorted);
      } catch (err: any) {
        console.error("Error cargando Home Menu:", err);
        setError(err.response?.data?.message || "No se pudieron cargar los accesos");
      } finally {
        setLoading(false);
      }
    };

    loadHomeMenus();
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-3 text-muted">Cargando tus accesos...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="alert alert-danger" role="alert">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-1">
            <i className="fas fa-home me-2 text-primary"></i>
            Bienvenido
          </h1>
          <p className="text-secondary mb-0">
            ¿Qué tarea necesitas realizar hoy?
          </p>
        </div>
      </div>

      {/* Cards de Home Menu */}
      {homeMenus.length > 0 ? (
        <Row className="g-4 mb-5">
          {homeMenus.map((item) => (
            <Col key={item.id} lg={3} md={4} sm={6}>
              <Link to={item.slug} className="text-decoration-none">
                <Card 
                  className="h-100 border-0 shadow-sm hover-shadow transition-all"
                  style={{ 
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer"
                  }}
                  title={item.description}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 0.5rem 1rem rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 0.125rem 0.25rem rgba(0,0,0,0.075)";
                  }}
                >
                  <Card.Body className="text-center p-4">
                    {/* Icono con color */}
                    <div 
                      className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: "64px",
                        height: "64px",
                        backgroundColor: `${item.color}20`,
                        color: item.color,
                        fontSize: "1.5rem"
                      }}
                    >
                      <i className={`fas fa-${item.icon}`}></i>
                    </div>

                    {/* Título */}
                    <Card.Title className="fw-bold mb-2 text-dark">
                      {item.title}
                    </Card.Title>

                    {/* Descripción */}
                    <Card.Text className="text-muted small mb-3">
                      {item.description}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-center py-5 mb-5">
          <i className="fas fa-th-large fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No tienes accesos configurados</h5>
          <p className="text-muted small">
            Contacta al administrador para asignarte módulos.
          </p>
        </div>
      )}

      {/* ✅ Accesos Rápidos con estilos personalizados */}
      <Row className="g-3">
        <Col xs={12}>
          <h3 className="h5 fw-bold mb-3">
            <i className="fas fa-bolt me-2 text-warning"></i>
            Accesos Rápidos
          </h3>
        </Col>
        
        {QUICK_ACCESS_CONFIG.map((access, idx) => (
          <Col key={idx} xs="auto">
            <a 
              href={access.url}
              className="text-decoration-none d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill border-0 shadow-sm quick-access-pill transition-all"
              title={access.description}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: access.gradient,
                color: "#fff",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 0.5rem 1rem ${access.color}40`; // 25% opacity
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 0.125rem 0.25rem rgba(0,0,0,0.075)";
              }}
            >
              <i className={`fas fa-${access.icon} me-1`}></i>
              <span className="fw-medium">{access.title}</span>
            </a>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Home;