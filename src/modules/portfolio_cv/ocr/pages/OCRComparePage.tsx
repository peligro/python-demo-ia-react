// src/modules/portfolio_cv/ocr/pages/OCRComparePage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, ListGroup } from "react-bootstrap";
import { ocrService } from "../services/ocrService";
import type { CompareDocumentsResponse } from "../interfaces/ocrInterfaces";

const STATIC_IMAGES = [
  { path: "static/images/viejos.jpg", label: "Viejos (prueba general)" },
  { path: "static/images/factura.jpg", label: "Factura escaneada" },
  { path: "static/images/documento.png", label: "Documento de texto" },
];

const OCRComparePage = () => {
  const [imagePath1, setImagePath1] = useState(STATIC_IMAGES[0].path);
  const [imagePath2, setImagePath2] = useState(STATIC_IMAGES[1].path);
  const [language, setLanguage] = useState<"spa" | "eng" | "spa+eng">("spa");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareDocumentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await ocrService.compare({
        image_path_1: imagePath1,
        image_path_2: imagePath2,
        language,
      });
      setResult(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || "Error al comparar");
    } finally {
      setLoading(false);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "danger";
  };

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <Link to="/portfolio-cv/ocr" className="text-decoration-none">
          <small><i className="fas fa-arrow-left me-1"></i>Volver a OCR</small>
        </Link>
        <h2 className="mt-2 mb-1">
          <i className="fas fa-code-compare me-2" style={{ color: "#F59E0B" }}></i>
          Comparación de Documentos
        </h2>
        <p className="text-muted mb-0">Compara dos imágenes y detecta diferencias</p>
      </div>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="mb-3"><i className="fas fa-sliders me-2"></i>Configuración</h6>

              <Form.Group className="mb-3">
                <Form.Label>Imagen 1</Form.Label>
                <Form.Select value={imagePath1} onChange={(e) => setImagePath1(e.target.value)}>
                  {STATIC_IMAGES.map((img) => (
                    <option key={img.path} value={img.path}>{img.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Imagen 2</Form.Label>
                <Form.Select value={imagePath2} onChange={(e) => setImagePath2(e.target.value)}>
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

              <Button
                variant="warning"
                className="w-100 text-white"
                onClick={handleCompare}
                disabled={loading}
              >
                {loading ? (
                  <><Spinner size="sm" animation="border" className="me-2" />Comparando...</>
                ) : (
                  <><i className="fas fa-code-compare me-2"></i>Comparar documentos</>
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
                <i className="fas fa-code-compare fa-3x text-muted mb-3"></i>
                <p className="text-muted mb-0">Selecciona dos imágenes para compararlas</p>
              </Card.Body>
            </Card>
          )}

          {result && (
            <>
              {/* Resultado principal */}
              <Card className="border-0 shadow-sm mb-3">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={4} className="text-center">
                      <div className="small text-muted mb-2">Similitud</div>
                      <h1 className={`text-${getSimilarityColor(result.similarity_score)}`}>
                        {result.similarity_score.toFixed(1)}%
                      </h1>
                    </Col>
                    <Col md={4} className="text-center">
                      <div className="small text-muted mb-2">Estado</div>
                      {result.are_identical ? (
                        <Badge bg="success" className="px-3 py-2">
                          <i className="fas fa-check-circle me-1"></i>Idénticos
                        </Badge>
                      ) : (
                        <Badge bg="danger" className="px-3 py-2">
                          <i className="fas fa-times-circle me-1"></i>Diferentes
                        </Badge>
                      )}
                    </Col>
                    <Col md={4} className="text-center">
                      <div className="small text-muted mb-2">Tiempo</div>
                      <h4 className="text-warning mb-0">{result.processing_time_ms}ms</h4>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Diferencias */}
              {!result.are_identical && result.differences.length > 0 && (
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">
                      <i className="fas fa-not-equal me-2 text-danger"></i>
                      Diferencias encontradas <Badge bg="danger" className="ms-2">{result.differences.length}</Badge>
                    </h6>
                  </Card.Header>
                  <ListGroup variant="flush" style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {result.differences.map((diff, idx) => (
                      <ListGroup.Item key={idx} className="small">
                        {diff}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card>
              )}

              {/* Textos lado a lado */}
              <Row className="g-3">
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-primary text-white">
                      <h6 className="mb-0"><i className="fas fa-file me-2"></i>Documento 1</h6>
                    </Card.Header>
                    <Card.Body>
                      <pre
                        className="mb-0 p-2 bg-light rounded"
                        style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem", maxHeight: "300px", overflowY: "auto" }}
                      >
                        {result.text_1 || "(Vacío)"}
                      </pre>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Header className="bg-info text-white">
                      <h6 className="mb-0"><i className="fas fa-file me-2"></i>Documento 2</h6>
                    </Card.Header>
                    <Card.Body>
                      <pre
                        className="mb-0 p-2 bg-light rounded"
                        style={{ whiteSpace: "pre-wrap", fontSize: "0.8rem", maxHeight: "300px", overflowY: "auto" }}
                      >
                        {result.text_2 || "(Vacío)"}
                      </pre>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default OCRComparePage;