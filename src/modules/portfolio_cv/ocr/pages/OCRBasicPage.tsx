//src/modules/portfolio_cv/ocr/pages/OCRBasicPage.tsx
import { useState } from "react";
import {
  Card,
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Badge,
  Modal,
  Alert,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import type {
  OCRBasicResponse,
  StaticImage,
} from "../interfaces/ocrInterfaces";
import { ocrService } from "../services/ocrService";

const STATIC_IMAGES: StaticImage[] = [
  { path: "static/images/ocr_texto_1.png", label: "Ejemplo 1" },
  { path: "static/images/ocr_texto_2.png", label: "Ejemplo 2" },
  { path: "static/images/ocr_texto_3.png", label: "Ejemplo 3" },
  { path: "static/images/ocr_texto_4.png", label: "Ejemplo 4" },
];

const OCRBasicPage = () => {
  const [selectedImagePath, setSelectedImagePath] = useState<string>("");
  const [customImagePath, setCustomImagePath] = useState<string>("");
  const [language, setLanguage] = useState<"spa" | "eng" | "spa+eng">("spa");
  const [result, setResult] = useState<OCRBasicResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "danger">("success");

  const getActiveImagePath = () => customImagePath || selectedImagePath;

  const getPreviewUrl = () => {
    const path = getActiveImagePath();
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8050";
    return `${baseUrl}/${path}`;
  };

  const handleDetect = async () => {
    const imagePath = getActiveImagePath();
    if (!imagePath) {
      setToastMessage("⚠️ Por favor selecciona una imagen");
      setToastVariant("danger");
      setShowToast(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ocrService.basic({
        image_path: imagePath,
        language,
      });
      setResult(response);
      setToastMessage(`✅ Texto extraído: ${response.word_count} palabras`);
      setToastVariant("success");
      setShowToast(true);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Error en OCR";
      setError(errorMessage);
      setToastMessage("❌ Error en OCR");
      setToastVariant("danger");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedImagePath("");
    setCustomImagePath("");
    setResult(null);
    setError(null);
  };

  const previewUrl = getPreviewUrl();

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <Link to="/portfolio-cv/ocr">OCR</Link>
              </li>
              <li className="breadcrumb-item active">OCR Básico</li>
            </ol>
          </nav>
          <h2 className="mb-1">
            <i className="fas fa-file-lines me-2 text-primary"></i>
            OCR Básico
          </h2>
          <p className="text-muted mb-0">
            Extrae texto de imágenes usando Tesseract OCR
          </p>
        </div>
        <Button
          variant="outline-secondary"
          onClick={() => setShowAboutModal(true)}
        >
          <i className="fas fa-info-circle me-2"></i>Acerca de
        </Button>
      </div>

      <Row className="g-4">
        {/* COLUMNA IZQUIERDA */}
        <Col lg={5} xl={4}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <i className="fas fa-images me-2"></i>Seleccionar Imagen
              </h6>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Imágenes disponibles</Form.Label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {STATIC_IMAGES.map((img) => (
                    <Button
                      key={img.path}
                      variant={
                        selectedImagePath === img.path
                          ? "primary"
                          : "outline-primary"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedImagePath(img.path);
                        setCustomImagePath("");
                        setResult(null);
                      }}
                    >
                      {img.label}
                    </Button>
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>O ingresa ruta personalizada</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="static/images/tu_imagen.jpg"
                  value={customImagePath}
                  onChange={(e) => {
                    setCustomImagePath(e.target.value);
                    setSelectedImagePath("");
                    setResult(null);
                  }}
                />
              </Form.Group>

              {previewUrl && (
                <div className="mb-3">
                  <Form.Label>Vista previa</Form.Label>
                  <div
                    className="border rounded p-2 text-center bg-light"
                    style={{ maxHeight: "250px", overflow: "auto" }}
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="img-fluid rounded"
                      style={{ maxHeight: "230px" }}
                    />
                  </div>
                </div>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Idioma del texto</Form.Label>
                <Form.Select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value as "spa" | "eng" | "spa+eng")
                  }
                >
                  <option value="spa">Español</option>
                  <option value="eng">Inglés</option>
                  <option value="spa+eng">Español + Inglés</option>
                </Form.Select>
              </Form.Group>

              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  onClick={handleDetect}
                  disabled={!getActiveImagePath() || loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-wand-magic-sparkles me-2"></i>
                      Extraer Texto
                    </>
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleClear}
                  disabled={!getActiveImagePath()}
                >
                  <i className="fas fa-trash-alt me-2"></i>Limpiar
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* COLUMNA DERECHA */}
        <Col lg={7} xl={8}>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {result && (
            <>
              {/* Estadísticas */}
              <Row className="g-3 mb-3">
                <Col md={3}>
                  <Card className="border-0 shadow-sm bg-primary text-white">
                    <Card.Body className="text-center">
                      <div className="display-6 fw-bold">
                        {result.word_count}
                      </div>
                      <small>Palabras</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-0 shadow-sm bg-info text-white">
                    <Card.Body className="text-center">
                      <div className="display-6 fw-bold">
                        {result.confidence.toFixed(1)}%
                      </div>
                      <small>Confianza</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-0 shadow-sm bg-success text-white">
                    <Card.Body className="text-center">
                      <div className="display-6 fw-bold">
                        {result.processing_time_ms}ms
                      </div>
                      <small>Tiempo</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-0 shadow-sm bg-warning text-dark">
                    <Card.Body className="text-center">
                      <div className="display-6 fw-bold">
                        {result.language_used}
                      </div>
                      <small>Idioma</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Texto extraído */}
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <i className="fas fa-file-lines me-2 text-primary"></i>
                    Texto Extraído
                  </h6>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(result.extracted_text);
                      setToastMessage("📋 Texto copiado al portapapeles");
                      setToastVariant("success");
                      setShowToast(true);
                    }}
                  >
                    <i className="fas fa-copy me-1"></i>Copiar
                  </Button>
                </Card.Header>
                <Card.Body>
                  <pre
                    className="bg-light p-3 rounded"
                    style={{
                      maxHeight: "400px",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      fontSize: "0.9rem",
                    }}
                  >
                    {result.extracted_text || "(No se detectó texto)"}
                  </pre>
                </Card.Body>
              </Card>
            </>
          )}

          {!result && !error && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <i className="fas fa-file-lines fa-4x text-muted mb-3 opacity-25"></i>
                <h5 className="text-muted mb-2">Sin resultados aún</h5>
                <p className="text-muted">
                  Selecciona una imagen y haz clic en "Extraer Texto"
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* MODAL ACERCA DE */}
      <Modal
        show={showAboutModal}
        onHide={() => setShowAboutModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-file-lines me-2"></i>OCR Básico
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <h6>¿Qué hace este módulo?</h6>
          <p className="text-muted">
            Extrae texto de imágenes usando <strong>Tesseract OCR</strong>, el
            motor de reconocimiento óptico de caracteres más popular del mundo,
            mantenido por Google.
          </p>
          <h6 className="mt-3">Características</h6>
          <ul>
            <li>Extracción de texto plano desde imágenes</li>
            <li>Soporte para español, inglés o ambos</li>
            <li>Cálculo de confianza promedio (0-100%)</li>
            <li>Conteo automático de palabras</li>
            <li>Medición de tiempo de procesamiento</li>
          </ul>
          <h6 className="mt-3">Tecnologías</h6>
          <div className="d-flex flex-wrap gap-2">
            <Badge bg="primary">Tesseract OCR</Badge>
            <Badge bg="primary">pytesseract</Badge>
            <Badge bg="primary">Python 3.12</Badge>
            <Badge bg="info">React 19</Badge>
            <Badge bg="info">TypeScript</Badge>
          </div>
        </Modal.Body>
      </Modal>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg={toastVariant}
        >
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default OCRBasicPage;
