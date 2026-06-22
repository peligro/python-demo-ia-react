//src/modules/portfolio_cv/ocr/pages/OCRExtractPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, ListGroup } from "react-bootstrap";
import { ocrService } from "../services/ocrService";
import type { ExtractDataResponse, ExtractPattern } from "../interfaces/ocrInterfaces";

const STATIC_IMAGES = [
  { path: "static/images/viejos.jpg", label: "Viejos (prueba general)" },
  { path: "static/images/factura.jpg", label: "Factura escaneada" },
  { path: "static/images/documento.png", label: "Documento de texto" },
];

const PATTERN_OPTIONS: { value: ExtractPattern; label: string; icon: string }[] = [
  { value: "email", label: "Emails", icon: "fa-envelope" },
  { value: "phone", label: "Teléfonos", icon: "fa-phone" },
  { value: "rut", label: "RUTs (Chile)", icon: "fa-id-card" },
  { value: "date", label: "Fechas", icon: "fa-calendar" },
  { value: "url", label: "URLs", icon: "fa-link" },
];

const OCRExtractPage = () => {
  const [imagePath, setImagePath] = useState(STATIC_IMAGES[0].path);
  const [language, setLanguage] = useState<"spa" | "eng" | "spa+eng">("spa");
  const [patterns, setPatterns] = useState<ExtractPattern[]>(["email", "phone", "rut"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePattern = (p: ExtractPattern) => {
    setPatterns((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleProcess = async () => {
    if (patterns.length === 0) {
      setError("Selecciona al menos un patrón a extraer");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await ocrService.extract({
        image_path: imagePath,
        language,
        extract_patterns: patterns,
      });
      setResult(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Error al procesar");
    } finally {
      setLoading(false);
    }
  };

  const renderPatternList = (title: string, items: string[], icon: string, color: string) => (
    <Card className="border-0 shadow-sm mb-3">
      <Card.Header className="bg-white">
        <h6 className="mb-0">
          <i className={`fas ${icon} me-2`} style={{ color }}></i>
          {title} <Badge bg="secondary" className="ms-2">{items.length}</Badge>
        </h6>
      </Card.Header>
      {items.length > 0 ? (
        <ListGroup variant="flush">
          {items.map((item, idx) => (
            <ListGroup.Item key={idx} className="small">
              <code>{item}</code>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : (
        <Card.Body className="text-muted small text-center">No se encontraron resultados</Card.Body>
      )}
    </Card>
  );

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <Link to="/portfolio-cv/ocr" className="text-decoration-none">
          <small><i className="fas fa-arrow-left me-1"></i>Volver a OCR</small>
        </Link>
        <h2 className="mt-2 mb-1">
          <i className="fas fa-database me-2 text-success"></i>
          Extracción de Datos Estructurados
        </h2>
        <p className="text-muted mb-0">Extrae información específica usando OCR + Regex</p>
      </div>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="mb-3"><i className="fas fa-sliders me-2"></i>Configuración</h6>

              <Form.Group className="mb-3">
                <Form.Label>Imagen</Form.Label>
                <Form.Select value={imagePath} onChange={(e) => setImagePath(e.target.value)}>
                  {STATIC_IMAGES.map((img) => (
                    <option key={img.path} value={img.path}>{img.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Idioma</Form.Label>
                <Form.Select value={language} onChange={(e) => setLanguage(e.target.value as any)}>
                  <option value="spa">Español</option>
                  <option value="eng">Inglés</option>
                  <option value="spa+eng">Español + Inglés</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Patrones a extraer</Form.Label>
                {PATTERN_OPTIONS.map((opt) => (
                  <Form.Check
                    key={opt.value}
                    type="checkbox"
                    id={`pat-${opt.value}`}
                    label={
                      <span>
                        <i className={`fas ${opt.icon} me-2 text-primary`}></i>
                        {opt.label}
                      </span>
                    }
                    checked={patterns.includes(opt.value)}
                    onChange={() => togglePattern(opt.value)}
                    className="mb-2"
                  />
                ))}
              </Form.Group>

              <Button
                variant="success"
                className="w-100"
                onClick={handleProcess}
                disabled={loading}
              >
                {loading ? (
                  <><Spinner size="sm" animation="border" className="me-2" />Procesando...</>
                ) : (
                  <><i className="fas fa-magnifying-glass me-2"></i>Extraer datos</>
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {error && <Alert variant="danger">{error}</Alert>}

          {!result && !loading && !error && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <i className="fas fa-database fa-3x text-muted mb-3"></i>
                <p className="text-muted mb-0">Selecciona los patrones y ejecuta la extracción</p>
              </Card.Body>
            </Card>
          )}

          {result && (
            <>
              <Alert variant="info" className="d-flex align-items-center">
                <i className="fas fa-clock me-2"></i>
                <span>Tiempo de procesamiento: <strong>{result.processing_time_ms}ms</strong></span>
              </Alert>

              <Row>
                <Col md={6}>
                  {patterns.includes("email") && renderPatternList("Emails", result.extracted_data.emails, "fa-envelope", "#3B82F6")}
                  {patterns.includes("phone") && renderPatternList("Teléfonos", result.extracted_data.phones, "fa-phone", "#10B981")}
                  {patterns.includes("rut") && renderPatternList("RUTs", result.extracted_data.ruts, "fa-id-card", "#8B5CF6")}
                </Col>
                <Col md={6}>
                  {patterns.includes("date") && renderPatternList("Fechas", result.extracted_data.dates, "fa-calendar", "#F59E0B")}
                  {patterns.includes("url") && renderPatternList("URLs", result.extracted_data.urls, "fa-link", "#EF4444")}
                </Col>
              </Row>

              <Card className="border-0 shadow-sm mt-3">
                <Card.Header className="bg-white">
                  <h6 className="mb-0"><i className="fas fa-align-left me-2"></i>Texto crudo</h6>
                </Card.Header>
                <Card.Body>
                  <pre
                    className="mb-0 p-3 bg-light rounded"
                    style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", maxHeight: "300px", overflowY: "auto" }}
                  >
                    {result.raw_text || "(Vacío)"}
                  </pre>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default OCRExtractPage;
