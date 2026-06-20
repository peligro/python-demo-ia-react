//src/modules/portfolio/face_detection/pages/FaceDetectionPage.tsx
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
import type {
  FaceDetectionResponse,
  FaceDetectionRequest,
} from "../interfaces/face_detectionInterfaces";
import { faceDetectionService } from "../services/face_detectionService";

// Rutas estáticas de imágenes disponibles
const STATIC_IMAGES = [
  { path: "static/images/mujer.png", label: "Mujer 1" },
  { path: "static/images/hombre.png", label: "Hombre" },
  { path: "static/images/grupo.png", label: "Grupo" },
  { path: "static/images/familia.png", label: "Familia" },
];

const FaceDetectionPage = () => {
  // Estado principal
  const [selectedImagePath, setSelectedImagePath] = useState<string>("");
  const [customImagePath, setCustomImagePath] = useState<string>("");
  const [result, setResult] = useState<FaceDetectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado UI
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<"success" | "danger" | "info">("success");

  // Manejar selección de imagen estática
  const handleImageSelect = (path: string) => {
    setSelectedImagePath(path);
    setCustomImagePath("");
    setResult(null);
    setError(null);
  };

  // Manejar ruta personalizada
  const handleCustomPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomImagePath(e.target.value);
    setSelectedImagePath("");
    setResult(null);
    setError(null);
  };

  // Obtener la ruta de imagen activa
  const getActiveImagePath = () => {
    return customImagePath || selectedImagePath;
  };

  // Obtener URL de preview
  const getPreviewUrl = () => {
    const path = getActiveImagePath();
    if (!path) return null;
    
    if (path.startsWith("http")) return path;
    
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8050";
    return `${baseUrl}/${path}`;
  };

  // Manejar detección
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
      const request: FaceDetectionRequest = {
        image_path: imagePath,
        method: "haarcascade",
        min_face_size: 30,
      };

      console.log("📤 Enviando request al backend:", request);

      const response = await faceDetectionService.detectFaces(request);
      
      console.log("✅ Respuesta del backend:", response);
      
      setResult(response);
      
      setToastMessage(`✅ ${response.total_faces_detected} cara(s) detectada(s)`);
      setToastVariant("success");
      setShowToast(true);
    } catch (err: any) {
      console.error("❌ Error en detección:", err);
      const errorMessage =
        err.response?.data?.detail || err.message || "Error al detectar caras";
      setError(errorMessage);
      setToastMessage("❌ Error en la detección");
      setToastVariant("danger");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar
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
          <h2 className="mb-1">
            <i className="fas fa-face-viewfinder me-2 text-primary"></i>
            Detección de Caras y Ojos
          </h2>
          <p className="text-muted mb-0">
            Detecta automáticamente caras y ojos en imágenes usando Haar Cascade
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
        {/* COLUMNA IZQUIERDA: Selección de imagen y configuración */}
        <Col lg={5} xl={4}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <i className="fas fa-images me-2"></i>Seleccionar Imagen
              </h6>
            </Card.Header>
            <Card.Body>
              {/* Imágenes estáticas disponibles */}
              <Form.Group className="mb-3">
                <Form.Label>Imágenes disponibles</Form.Label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {STATIC_IMAGES.map((img) => (
                    <Button
                      key={img.path}
                      variant={selectedImagePath === img.path ? "primary" : "outline-primary"}
                      size="sm"
                      onClick={() => handleImageSelect(img.path)}
                    >
                      {img.label}
                    </Button>
                  ))}
                </div>
                <Form.Text className="text-muted">
                  Selecciona una imagen predefinida o ingresa una ruta personalizada
                </Form.Text>
              </Form.Group>

              {/* Ruta personalizada */}
              <Form.Group className="mb-3">
                <Form.Label>O ingresa ruta personalizada</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="static/images/tu_imagen.jpg"
                  value={customImagePath}
                  onChange={handleCustomPathChange}
                  className="mb-2"
                />
                <Form.Text className="text-muted">
                  Ejemplo: static/images/foto.jpg
                </Form.Text>
              </Form.Group>

              {/* Preview */}
              {previewUrl && (
                <div className="mb-3">
                  <Form.Label>Vista previa</Form.Label>
                  <div
                    className="border rounded p-2 text-center bg-light"
                    style={{ maxHeight: "300px", overflow: "auto" }}
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="img-fluid rounded"
                      style={{ maxHeight: "280px" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        setToastMessage("⚠️ No se pudo cargar la imagen. Verifica que exista en el backend.");
                        setToastVariant("danger");
                        setShowToast(true);
                      }}
                    />
                    <div className="mt-2 text-muted small">
                      {getActiveImagePath()}
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  onClick={handleDetect}
                  disabled={!getActiveImagePath() || loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Detectando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search me-2"></i>
                      Detectar Caras
                    </>
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleClear}
                  disabled={!getActiveImagePath()}
                >
                  <i className="fas fa-trash-alt me-2"></i>
                  Limpiar
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Información del método */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <i className="fas fa-info-circle me-2 text-info"></i>
                Información
              </h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled mb-0 small text-muted">
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  <strong>Haar Cascade:</strong> Algoritmo clásico de OpenCV basado en características Haar-like
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  <strong>Detección de ojos:</strong> Automática dentro de cada cara
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  <strong>Rápido:</strong> Procesamiento en milisegundos
                </li>
                <li>
                  <i className="fas fa-check text-success me-2"></i>
                  <strong>Resultados:</strong> Coordenadas y nivel de confianza
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>

        {/* COLUMNA DERECHA: Resultados */}
        <Col lg={7} xl={8}>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {result && (
            <>
              {/* Imagen procesada */}
              <Card className="border-0 shadow-sm mb-3">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <i className="fas fa-image me-2 text-primary"></i>
                    Resultado
                  </h6>
                  <Badge bg="success">
                    {result.total_faces_detected} cara(s)
                  </Badge>
                </Card.Header>
                <Card.Body className="text-center">
                  <img
                    src={result.processed_image_url}
                    alt="Detección"
                    className="img-fluid rounded border"
                    style={{ maxHeight: "500px" }}
                    onError={(e) => {
                      console.error("Error cargando imagen procesada");
                      setToastMessage("⚠️ No se pudo cargar la imagen procesada");
                      setToastVariant("danger");
                      setShowToast(true);
                    }}
                  />
                </Card.Body>
              </Card>

              {/* Estadísticas */}
              <Row className="g-3 mb-3">
                <Col md={4}>
                  <Card className="border-0 shadow-sm bg-primary text-white">
                    <Card.Body className="text-center">
                      <div className="display-6 fw-bold">
                        {result.total_faces_detected}
                      </div>
                      <small>Caras detectadas</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm bg-info text-white">
                    <Card.Body className="text-center">
                      <div className="display-6 fw-bold">
                        {result.method_used}
                      </div>
                      <small>Método usado</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm bg-success text-white">
                    <Card.Body className="text-center">
                      <div className="display-6 fw-bold">
                        {result.processing_time_ms}ms
                      </div>
                      <small>Tiempo de procesamiento</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Detalles de detecciones */}
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">
                    <i className="fas fa-list me-2 text-primary"></i>
                    Detalles de Detecciones
                  </h6>
                </Card.Header>
                <Card.Body>
                  {result.faces.length === 0 ? (
                    <Alert variant="info">
                      <i className="fas fa-info-circle me-2"></i>
                      No se detectaron caras en la imagen
                    </Alert>
                  ) : (
                    result.faces.map((face, index) => (
                      <Card key={face.face_id} className="mb-2 border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">
                              <i className="fas fa-user me-2"></i>
                              Cara #{index + 1}
                            </h6>
                            <Badge bg="primary">
                              {(face.bounding_box.confidence * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <Row className="small">
                            <Col md={6}>
                              <strong>Bounding Box:</strong>
                              <ul className="list-unstyled mb-0 mt-1">
                                <li>
                                  X: {face.bounding_box.x}px, Y:{" "}
                                  {face.bounding_box.y}px
                                </li>
                                <li>
                                  Ancho: {face.bounding_box.width}px, Alto:{" "}
                                  {face.bounding_box.height}px
                                </li>
                              </ul>
                            </Col>
                            <Col md={6}>
                              <strong>Ojos detectados:</strong>{" "}
                              {face.eyes.total_eyes_detected}/2
                              {face.eyes.left_eye && (
                                <div className="mt-1">
                                  <small className="text-muted">
                                    Izquierdo: (
                                    {face.eyes.left_eye.x},
                                    {face.eyes.left_eye.y})
                                  </small>
                                </div>
                              )}
                              {face.eyes.right_eye && (
                                <div>
                                  <small className="text-muted">
                                    Derecho: (
                                    {face.eyes.right_eye.x},
                                    {face.eyes.right_eye.y})
                                  </small>
                                </div>
                              )}
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </Card.Body>
              </Card>
            </>
          )}

          {!result && !error && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <i className="fas fa-face-viewfinder fa-4x text-muted mb-3 opacity-25"></i>
                <h5 className="text-muted mb-2">
                  Sin resultados aún
                </h5>
                <p className="text-muted">
                  Selecciona una imagen y haz clic en "Detectar Caras" para comenzar
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
        size="xl"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-info-circle me-2"></i>
            Detección de Caras y Ojos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={7}>
              <h5 className="mb-3">¿Qué es este módulo?</h5>
              <p className="text-muted">
                Este módulo permite detectar automáticamente{" "}
                <strong>caras y ojos</strong> en imágenes utilizando el algoritmo{" "}
                <strong>Haar Cascade</strong> de OpenCV.
              </p>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Haar Cascade:</strong> Algoritmo clásico de OpenCV basado en características Haar-like. Muy rápido y eficiente.
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Detección de ojos:</strong> Detecta automáticamente los ojos izquierdo y derecho dentro de cada cara encontrada.
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Resultados visuales:</strong> Muestra bounding boxes con coordenadas y nivel de confianza.
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Procesamiento rápido:</strong> Detección en milisegundos.
                </li>
              </ul>
            </Col>
            <Col md={5}>
              <h6 className="mb-3">Tecnologías</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="primary" className="p-2">
                  Python 3.12
                </Badge>
                <Badge bg="primary" className="p-2">
                  OpenCV
                </Badge>
                <Badge bg="primary" className="p-2">
                  NumPy
                </Badge>
                <Badge bg="info" className="p-2">
                  React 19
                </Badge>
                <Badge bg="info" className="p-2">
                  TypeScript
                </Badge>
                <Badge bg="warning" className="p-2 text-dark">
                  Bootstrap 5
                </Badge>
              </div>

              <h6 className="mb-2">Archivos del módulo</h6>
              <div className="small">
                <div className="mb-2">
                  <strong className="d-block text-primary mb-1">
                    🐍 Backend (FastAPI)
                  </strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li>
                      <code>schemas/face_detection.py</code>
                    </li>
                    <li>
                      <code>
                        services/face_detection/face_detection_service.py
                      </code>
                    </li>
                    <li>
                      <code>
                        router/face_detection/face_detection_router.py
                      </code>
                    </li>
                  </ul>
                </div>
                <div>
                  <strong className="d-block text-info mb-1">
                    ⚛️ Frontend (React)
                  </strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li>
                      <code>
                        src/modules/portfolio/face_detection/pages/FaceDetectionPage.tsx
                      </code>
                    </li>
                    <li>
                      <code>
                        src/modules/portfolio/face_detection/services/faceDetectionService.ts
                      </code>
                    </li>
                    <li>
                      <code>
                        src/modules/portfolio/face_detection/interfaces/face_detectionInterfaces.ts
                      </code>
                    </li>
                  </ul>
                </div>
              </div>
            </Col>
          </Row>
          <hr className="my-4" />
          <Row>
            <Col>
              <h6 className="mb-3">Características principales</h6>
              <Row className="g-3">
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-bolt fa-2x text-warning mb-2"></i>
                    <div className="small fw-bold">Rápido</div>
                    <small className="text-muted">
                      Procesamiento en milisegundos
                    </small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-bullseye fa-2x text-success mb-2"></i>
                    <div className="small fw-bold">Preciso</div>
                    <small className="text-muted">
                      Detección de alta precisión
                    </small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-eye fa-2x text-primary mb-2"></i>
                    <div className="small fw-bold">Detección de ojos</div>
                    <small className="text-muted">
                      Localización automática
                    </small>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAboutModal(false)}>
            <i className="fas fa-times me-2"></i>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast de notificaciones */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg={toastVariant}
        >
          <Toast.Body className="text-white">
            <i className="fas fa-bell me-2"></i>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default FaceDetectionPage;