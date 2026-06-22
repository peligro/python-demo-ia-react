//src/modules/home/pages/Home.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Badge } from "react-bootstrap";

// Tus módulos organizados por categoría - RUTAS CORREGIDAS
const MODULES = [
  {
    category: "🤖 IA & RAG",
    items: [
      {
        title: "Agente RAG KB",
        slug: "/portfolio/agente-kb", // ✅ Coincide con router
        description: "Base de conocimientos con contexto conversacional. La IA recuerda los últimos 10 mensajes.",
        icon: "fas fa-brain",
        color: "#8B5CF6",
        tags: ["RAG", "Vector DB", "Contexto"],
        tech: ["FastAPI", "pgvector", "Redis"]
      },
      {
        title: "Agente RAG PDF Multi-Agent",
        slug: "/portfolio/agent-rag-pdfmulti-agent", // ✅ CORREGIDO (sin guión entre pdf y multi)
        description: "Procesa manuales PDF automáticamente. Cola de procesamiento con Redis.",
        icon: "fas fa-file-pdf",
        color: "#EF4444",
        tags: ["PDF", "Multi-Agent", "Queue"],
        tech: ["Redis", "Celery", "LangChain"]
      },
      {
        title: "Chat con Historial",
        slug: "/portfolio/chat-history", // ✅ Coincide con router
        description: "Conversación multi-turno con contexto. Soporta 5 modelos diferentes.",
        icon: "fas fa-comments",
        color: "#3B82F6",
        tags: ["Chat", "Multi-Modelo", "Historial"],
        tech: ["Mistral", "GPT-4", "Claude"]
      }
    ]
  },
  {
    category: "👁️ Computer Vision",
    items: [
      {
        title: "Detección de Caras y Ojos",
        slug: "/portfolio-cv/face-detection", // ✅ CORREGIDO (portfolio-cv, no portfolio/cv)
        description: "Detección automática con Haar Cascade. Métricas en tiempo real.",
        icon: "fas fa-eye",
        color: "#10B981",
        tags: ["OpenCV", "Haar Cascade", "Real-time"],
        tech: ["Python", "OpenCV"]
      },
      {
        title: "OCR Básico",
        slug: "/portfolio-cv/ocr/basic", // ✅ CORREGIDO (portfolio-cv, no portfolio/ocr)
        description: "Extracción de texto de imágenes con Tesseract. Soporta múltiples idiomas.",
        icon: "fas fa-text-width",
        color: "#F59E0B",
        tags: ["OCR", "Tesseract", "Texto"],
        tech: ["Tesseract", "Python"]
      },
      {
        title: "Reconocimiento de Imágenes",
        slug: "/portfolio/image-recognition", // ✅ Coincide con router
        description: "Clasificación y análisis de imágenes con modelos pre-entrenados.",
        icon: "fas fa-image",
        color: "#EC4899",
        tags: ["CNN", "Clasificación", "IA"],
        tech: ["TensorFlow", "Keras"]
      }
    ]
  },
  {
    category: "🔧 Herramientas IA",
    items: [
      {
        title: "Traducción de Textos",
        slug: "/portfolio/traduccion-textos", // ✅ Coincide con router
        description: "Traduce a 25+ idiomas con IA. Soporta tono formal, casual o neutral.",
        icon: "fas fa-language",
        color: "#6366F1",
        tags: ["Traducción", "Multi-idioma", "NLP"],
        tech: ["OpenAI API", "NLP"]
      },
      {
        title: "Análisis de Sentimiento",
        slug: "/portfolio/analisis-de-sentimiento", // ✅ CORREGIDO (español, no sentiment-analysis)
        description: "Analiza tono emocional de textos. Útil para reviews y feedback.",
        icon: "fas fa-heart",
        color: "#EF4444",
        tags: ["Sentimiento", "NLP", "Análisis"],
        tech: ["Python", "NLTK"]
      },
      {
        title: "Generación de Consulta SQL",
        slug: "/portfolio/generate-sql", // ✅ CORREGIDO (generate-sql, no sql-generation)
        description: "Convierte lenguaje natural a SQL. Soporta PostgreSQL y MySQL.",
        icon: "fas fa-database",
        color: "#14B8A6",
        tags: ["SQL", "NL2SQL", "Database"],
        tech: ["OpenAI", "PostgreSQL"]
      }
    ]
  }
];

// Componente de Card con hover state mejorado
const ModuleCard = ({ module }: { module: any }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="h-100 border-0 shadow-sm"
      style={{
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered ? "translateY(-8px)" : "translateY(0)",
        boxShadow: isHovered 
          ? `0 20px 25px -5px ${module.color}30, 0 10px 10px -5px ${module.color}20`
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Barra superior con color animada */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${module.color}, ${module.color}CC)`,
          transform: isHovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.3s ease"
        }}
      />

      <Card.Body className="p-4">
        {/* Icono con animación */}
        <div 
          className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
          style={{
            width: "56px",
            height: "56px",
            backgroundColor: `${module.color}15`,
            color: module.color,
            fontSize: "1.5rem",
            transition: "all 0.3s ease",
            transform: isHovered ? "scale(1.1) rotate(5deg)" : "scale(1) rotate(0deg)"
          }}
        >
          <i className={module.icon}></i>
        </div>

        {/* Título */}
        <Card.Title 
          className="fw-bold mb-2"
          style={{
            transition: "color 0.3s ease",
            color: isHovered ? module.color : "#1f2937"
          }}
        >
          {module.title}
        </Card.Title>

        {/* Descripción */}
        <Card.Text className="text-muted mb-3">
          {module.description}
        </Card.Text>

        {/* Tags */}
        <div className="mb-3">
          {module.tags.map((tag: string, tagIdx: number) => (
            <Badge 
              key={tagIdx}
              bg="light" 
              text="dark"
              className="me-1 mb-1"
              style={{ 
                fontSize: "0.75rem",
                transition: "all 0.3s ease",
                backgroundColor: isHovered ? `${module.color}20` : "#f3f4f6",
                color: isHovered ? module.color : "#6b7280"
              }}
            >
              {tag}
            </Badge>
          ))}
        </div>

        {/* Tech stack */}
        <div 
          className="d-flex gap-2 small text-muted"
          style={{
            transition: "all 0.3s ease",
            opacity: isHovered ? 1 : 0.7
          }}
        >
          <i className="fas fa-tools mt-1"></i>
          <span>{module.tech.join(" • ")}</span>
        </div>
      </Card.Body>

      {/* Flecha indicadora */}
      <div 
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? "translateX(0)" : "translateX(-10px)",
          transition: "all 0.3s ease",
          color: module.color,
          fontSize: "1.2rem"
        }}
      >
        <i className="fas fa-arrow-right"></i>
      </div>
    </Card>
  );
};

const Home = () => {
  return (
    <Container fluid className="py-5">
      {/* ========== HERO SECTION ========== */}
      <Row className="mb-5">
        <Col lg={8} className="mx-auto text-center">
          <div className="mb-4">
            <Badge bg="primary" className="mb-3 px-3 py-2">
              <i className="fas fa-code me-2"></i>
              Portfolio de IA & Computer Vision
            </Badge>
          </div>
          
          <h1 className="display-4 fw-bold mb-3">
            Hola, soy <span className="text-primary">César Cancino</span>
          </h1>
          
          <p className="lead text-secondary mb-4">
            26 años desarrollando software • 19 cursos en Udemy • 10,000+ estudiantes
          </p>
          
          <p className="fs-5 text-muted mb-5">
            Construyo sistemas de <strong>IA empresarial</strong> que reducen costos en 60-70%. 
            Especialista en RAG, Computer Vision y optimización de APIs.
          </p>

          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <a 
              href="https://www.linkedin.com/in/cesarcancino" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg px-4"
            >
              <i className="fab fa-linkedin me-2"></i>
              LinkedIn
            </a>
            <a 
              href="https://github.com/peligro" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-dark btn-lg px-4"
            >
              <i className="fab fa-github me-2"></i>
              GitHub
            </a>
            <Link to="/portfolio" className="btn btn-outline-primary btn-lg px-4">
              <i className="fas fa-folder-open me-2"></i>
              Ver Proyectos
            </Link>
          </div>
        </Col>
      </Row>

      {/* ========== MÓDULOS POR CATEGORÍA ========== */}
      {MODULES.map((category, catIdx) => (
        <Row key={catIdx} className="mb-5">
          <Col xs={12}>
            <h2 className="h3 fw-bold mb-4 pb-2 border-bottom">
              {category.category}
            </h2>
          </Col>
          
          {category.items.map((module, idx) => (
            <Col key={idx} lg={4} md={6} className="mb-4">
              <Link to={module.slug} className="text-decoration-none">
                <ModuleCard module={module} />
              </Link>
            </Col>
          ))}
        </Row>
      ))}

      {/* ========== ACCESOS RÁPIDOS ========== */}
      <Row className="mt-5 pt-4 border-top">
        <Col xs={12}>
          <h3 className="h5 fw-bold mb-3">
            <i className="fas fa-bolt me-2 text-warning"></i>
            Accesos Rápidos
          </h3>
        </Col>
        {/* Aquí mantienes tu QUICK_ACCESS_CONFIG actual */}
      </Row>
    </Container>
  );
};

export default Home;