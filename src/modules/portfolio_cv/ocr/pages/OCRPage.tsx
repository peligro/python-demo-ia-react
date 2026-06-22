//src/modules/portfolio_cv/ocr/pages/OCRPage.tsx
import { Link } from "react-router-dom";
import { Container, Row, Col, Card } from "react-bootstrap";
import { OCR_FEATURES } from "../constants/contanst";





const OCRPage = () => {
  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="mb-1">
          <i className="fas fa-file-lines me-2 text-primary"></i>
          OCR - Reconocimiento Óptico de Caracteres
        </h2>
        <p className="text-muted mb-0">
          Extrae texto de imágenes usando Tesseract OCR con diferentes técnicas
          de preprocesamiento y extracción de datos
        </p>
      </div>

      {/* Tecnologías */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <h6 className="mb-2">
                <i className="fas fa-microchip me-2 text-primary"></i>
                Tecnologías utilizadas
              </h6>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-primary">Tesseract OCR</span>
                <span className="badge bg-primary">pytesseract</span>
                <span className="badge bg-primary">OpenCV</span>
                <span className="badge bg-primary">Python 3.12</span>
                <span className="badge bg-info">React 19</span>
                <span className="badge bg-info">TypeScript</span>
                <span className="badge bg-warning text-dark">Bootstrap 5</span>
              </div>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <div className="small text-muted">
                <i className="fas fa-language me-1"></i>
                Soporta: Español, Inglés
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Cards de características */}
      <Row className="g-4">
        {OCR_FEATURES.map((feature) => (
          <Col key={feature.path} lg={6} md={6}>
            <Link
              to={feature.path}
              className="text-decoration-none"
              style={{ display: "block" }}
            >
              <Card
                className="h-100 border-0 shadow-sm hover-shadow transition-all"
                style={{
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 0.5rem 1rem ${feature.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 0.125rem 0.25rem rgba(0,0,0,0.075)";
                }}
              >
                <Card.Body>
                  <div className="d-flex align-items-start mb-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: "60px",
                        height: "60px",
                        backgroundColor: `${feature.color}20`,
                        color: feature.color,
                      }}
                    >
                      <i className={`fas ${feature.icon} fa-2x`}></i>
                    </div>
                    <div>
                      <h5 className="mb-1 text-dark">{feature.title}</h5>
                      <p className="text-muted small mb-0">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <hr className="my-3" />

                  <h6 className="small text-muted mb-2">
                    <i className="fas fa-list-check me-1"></i>
                    Características:
                  </h6>
                  <ul className="list-unstyled mb-0">
                    {feature.features.map((feat, idx) => (
                      <li key={idx} className="small mb-1">
                        <i
                          className="fas fa-check text-success me-2"
                          style={{ fontSize: "0.75rem" }}
                        ></i>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </Card.Body>
                <Card.Footer className="bg-transparent border-top-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <i className="fas fa-arrow-right me-1"></i>
                      Ir al módulo
                    </small>
                    <i
                      className="fas fa-chevron-right"
                      style={{ color: feature.color }}
                    ></i>
                  </div>
                </Card.Footer>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      {/* Info adicional */}
      <Card className="border-0 shadow-sm mt-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6 className="mb-3">
                <i className="fas fa-circle-info me-2 text-info"></i>
                ¿Qué es OCR?
              </h6>
              <p className="small text-muted mb-0">
                <strong>OCR (Optical Character Recognition)</strong> es la
                tecnología que permite extraer texto de imágenes. Convierte fotos
                de documentos, capturas de pantalla y cualquier imagen con texto
                en texto editable y procesable.
              </p>
            </Col>
            <Col md={6}>
              <h6 className="mb-3">
                <i className="fas fa-lightbulb me-2 text-warning"></i>
                Casos de uso
              </h6>
              <ul className="small text-muted mb-0 ps-3">
                <li>Digitalización de documentos escaneados</li>
                <li>Extracción de datos de facturas y boletas</li>
                <li>Lectura de placas vehiculares</li>
                <li>Automatización de formularios</li>
                <li>Accesibilidad para personas con discapacidad visual</li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default OCRPage;