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
  ProgressBar,
  Alert,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { imageRecognitionService } from "../services/imageRecognitionService";
import type {
  ImageRecognitionRequest,
  ImageRecognitionResponse,
  ModelOption,
  SessionMetrics,
} from "../interfaces/imageRecognitionInterfaces";

// ✅ Modelos que soportan imágenes (multimodales)
const IMAGE_SUPPORTED_MODELS: ModelOption[] = [
  { value: "gpt-4o", label: "🤖 OpenAI GPT-4o", provider: "openai" },
  { value: "gpt-4o-mini", label: "🤖 OpenAI GPT-4o Mini", provider: "openai" },
  { value: "gemini-2.5-flash", label: "✨ Google Gemini 2.5", provider: "gemini" },
  { value: "gemini-2.0-flash", label: "✨ Google Gemini 2.0", provider: "gemini" },
];

// ✅ Todos los modelos (soportados + no soportados)
const ALL_MODELS: ModelOption[] = [
  ...IMAGE_SUPPORTED_MODELS,
  { value: "mistral-small-latest", label: "🌪️ Mistral Small", provider: "mistral", unsupported: true },
  { value: "claude-opus-4-8", label: "🧠 Claude 4 Opus", provider: "claude", unsupported: true },
  { value: "deepseek-chat", label: "🔍 DeepSeek Chat", provider: "deepseek", unsupported: true },
];

const ImageRecognitionPage = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("Describe esta imagen de manera objetiva y descriptiva.");
  const [result, setResult] = useState<ImageRecognitionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalAnalyses: 0,
    totalTokens: 0,
    avgLatency: 0,
    lastAnalysisTime: null,
  });

  const tokenQuota = {
    used: sessionMetrics.totalTokens,
    limit: 100000,
    resetAt: "00:00",
  };
  const tokenUsagePercent = (tokenQuota.used / tokenQuota.limit) * 100;

  // ✅ Validar si el modelo seleccionado soporta imágenes
  const isModelSupported = (model: string) => {
    return IMAGE_SUPPORTED_MODELS.some(m => m.value === model);
  };

  const handleAnalyze = async () => {
    if (!imageUrl.trim() || isLoading) return;

    // ✅ Validación temprana en frontend
    if (!isModelSupported(selectedModel)) {
      setError(`⚠️ El modelo "${selectedModel}" no soporta análisis de imágenes. Por favor elige OpenAI o Gemini.`);
      setToastMessage("❌ Modelo no compatible con imágenes");
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const request: ImageRecognitionRequest = {
        image_url: imageUrl.trim(),
        prompt: prompt.trim(),
        model: selectedModel as any,
      };

      const response = await imageRecognitionService.analyze(request);
      setResult(response);

      // Actualizar métricas
      setSessionMetrics((prev) => {
        const newTotal = prev.totalAnalyses + 1;
        const newLatency = response.metrics?.latency_ms || 0;
        return {
          totalAnalyses: newTotal,
          totalTokens: prev.totalTokens + (response.metrics?.total_tokens || 0),
          avgLatency: Math.round(
            (prev.avgLatency * prev.totalAnalyses + newLatency) / newTotal,
          ),
          lastAnalysisTime: new Date(),
        };
      });

      setToastMessage("✅ Análisis completado");
      setShowToast(true);
    } catch (err: any) {
      console.error("[ImageRecognition] Error:", err);
      setError(err.response?.data?.detail || "Error al analizar la imagen");
      setToastMessage("❌ Error en el análisis");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage("📋 Copiado al portapapeles");
    setShowToast(true);
  };

  const handleClear = () => {
    setImageUrl("");
    setPrompt("Describe esta imagen de manera objetiva y descriptiva.");
    setResult(null);
    setError(null);
    setSessionMetrics((prev) => ({
      ...prev,
      totalAnalyses: 0,
      totalTokens: 0,
      avgLatency: 0,
      lastAnalysisTime: null,
    }));
    setToastMessage("🗑️ Análisis reiniciado");
    setShowToast(true);
  };

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        {/* COLUMNA IZQUIERDA: Analizador de imágenes */}
        <Col lg={8} xl={9}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-image me-2 text-primary"></i>
                Reconocimiento de Imágenes
              </h2>
              <p className="text-muted mb-0">
                Sube una URL de imagen y obtén una descripción detallada usando IA multimodal.
              </p>
            </div>

            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => setShowAboutModal(true)}
                title="Acerca de este módulo"
              >
                <i className="fas fa-info-circle me-2"></i>Acerca de
              </Button>

              <Form.Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ width: "auto" }}
                size="sm"
                isInvalid={!isModelSupported(selectedModel)}
              >
                {ALL_MODELS.map((model) => (
                  <option 
                    key={model.value} 
                    value={model.value}
                    disabled={model.unsupported}
                  >
                    {model.label}{model.unsupported ? " ❌" : ""}
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>

          {/* Alerta de modelo no soportado */}
          {!isModelSupported(selectedModel) && (
            <Alert variant="warning" className="mb-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <strong>Modelo no compatible:</strong> {selectedModel} no soporta análisis de imágenes. 
              Por favor selecciona <strong>OpenAI</strong> o <strong>Gemini</strong>.
            </Alert>
          )}

          {/* Área de análisis */}
          <Row className="g-3 mb-3">
            {/* Input de URL y prompt */}
            <Col md={7}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-link me-2"></i>URL de la imagen
                  </h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <Form.Control
                    type="url"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={isLoading}
                    className="mb-3"
                  />
                  
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">Prompt personalizado (opcional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Describe esta imagen..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isLoading}
                      style={{ resize: "none" }}
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleCopy(imageUrl)}
                      disabled={!imageUrl}
                    >
                      <i className="fas fa-copy me-1"></i>Copiar URL
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleClear}
                      disabled={!imageUrl && !result}
                    >
                      <i className="fas fa-trash me-1"></i>Limpiar
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Resultado */}
            <Col md={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-eye me-2"></i>Resultado
                  </h6>
                </Card.Header>
                <Card.Body className="p-3">
                  {isLoading ? (
                    <div className="d-flex align-items-center justify-content-center h-100" style={{ minHeight: "200px" }}>
                      <div className="text-center">
                        <Spinner animation="border" variant="primary" className="mb-2" />
                        <p className="text-muted mb-0">Analizando imagen...</p>
                        <small className="text-muted">Usando {selectedModel}</small>
                      </div>
                    </div>
                  ) : error ? (
                    <Alert variant="danger">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {error}
                    </Alert>
                  ) : result ? (
                    <div>
                      <div className="p-3 bg-light rounded mb-3" style={{ whiteSpace: "pre-line" }}>
                        {result.description}
                      </div>
                      
                      <div className="border-top pt-2">
                        <small className="text-muted d-block">
                          <i className="fas fa-bolt me-1"></i>
                          {result.metrics.latency_ms}ms •{" "}
                          <i className="fas fa-coins me-1"></i>
                          {result.metrics.total_tokens} tokens
                        </small>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted" style={{ minHeight: "200px" }}>
                      <div className="text-center">
                        <i className="fas fa-image fa-2x mb-2 opacity-25"></i>
                        <p className="mb-0">El análisis aparecerá aquí</p>
                      </div>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="bg-light">
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => result && handleCopy(result.description)}
                      disabled={!result}
                    >
                      <i className="fas fa-copy me-1"></i>Copiar descripción
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          </Row>

          {/* Botón de análisis */}
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <small className="text-muted d-block">
                    <i className="fas fa-info-circle me-1"></i>
                    Consejo: Usa URLs públicas de imágenes (JPG, PNG, WebP). Evita imágenes muy grandes.
                  </small>
                </Col>
                <Col md={4} className="text-end">
                  <Button
                    variant="primary"
                    onClick={handleAnalyze}
                    disabled={!imageUrl.trim() || isLoading || !isModelSupported(selectedModel)}
                    className="w-100"
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic me-2"></i>
                        Analizar Imagen
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Ejemplos de URLs */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <i className="fas fa-lightbulb me-2 text-warning"></i>Ejemplos
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                {[
                  "https://picsum.photos/seed/example1/400/300.jpg",
                  "https://picsum.photos/seed/example2/400/300.jpg",
                  "https://picsum.photos/seed/example3/400/300.jpg",
                ].map((url, idx) => (
                  <Button
                    key={idx}
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setImageUrl(url)}
                    className="flex-grow-1"
                  >
                    Ejemplo {idx + 1}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* COLUMNA DERECHA: Métricas */}
        <Col lg={4} xl={3}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0">
                <i className="fas fa-chart-line me-2"></i>Métricas de Sesión
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Análisis</small>
                  <Badge bg="primary">{sessionMetrics.totalAnalyses}</Badge>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Tokens usados</small>
                  <small className="fw-bold">
                    {sessionMetrics.totalTokens.toLocaleString()}
                  </small>
                </div>
                <ProgressBar
                  now={tokenUsagePercent}
                  variant={
                    tokenUsagePercent > 90 ? "danger" :
                    tokenUsagePercent > 70 ? "warning" : "success"
                  }
                  style={{ height: "8px" }}
                  label={`${Math.round(tokenUsagePercent)}%`}
                  visuallyHidden
                />
                <small className="text-muted d-block mt-1">
                  Límite: {tokenQuota.limit.toLocaleString()} • Reinicia: {tokenQuota.resetAt}
                </small>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Latencia promedio</small>
                  <small className="fw-bold">
                    {sessionMetrics.avgLatency}ms
                  </small>
                </div>
                <ProgressBar
                  now={
                    sessionMetrics.avgLatency > 5000 ? 100 :
                    (sessionMetrics.avgLatency / 5000) * 100
                  }
                  variant={
                    sessionMetrics.avgLatency > 5000 ? "danger" :
                    sessionMetrics.avgLatency > 2500 ? "warning" : "success"
                  }
                  style={{ height: "8px" }}
                  visuallyHidden
                />
              </div>

              <div className="mb-3">
                <small className="text-muted d-block mb-1">Modelo activo</small>
                <Badge 
                  bg={isModelSupported(selectedModel) ? "secondary" : "danger"} 
                  className="w-100 text-start p-2"
                >
                  <i className="fas fa-microchip me-2"></i>
                  {selectedModel}
                  {!isModelSupported(selectedModel) && " ❌"}
                </Badge>
              </div>

              {sessionMetrics.lastAnalysisTime && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">Último análisis</small>
                  <small className="d-block">
                    {sessionMetrics.lastAnalysisTime.toLocaleTimeString()}
                  </small>
                </div>
              )}

              {/* ✅ Botón Limpiar análisis (nuevo) */}
              {(sessionMetrics.totalAnalyses > 0 || imageUrl || result) && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={handleClear}
                  className="w-100"
                >
                  <i className="fas fa-trash-alt me-2"></i>
                  Limpiar análisis
                </Button>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <i className="fas fa-lightbulb me-2 text-warning"></i>Tips
              </h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled mb-0 small text-muted">
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>Usa URLs públicas de imágenes
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>Formatos soportados: JPG, PNG, WebP
                </li>
                <li>
                  <i className="fas fa-check text-success me-2"></i>
                  Solo OpenAI y Gemini soportan imágenes
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* MODAL "ACERCA DE" */}
      <Modal
        show={showAboutModal}
        onHide={() => setShowAboutModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-info-circle me-2"></i>
            Reconocimiento de Imágenes
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={7}>
              <h5 className="mb-3">¿Qué es este módulo?</h5>
              <p className="text-muted">
                El módulo <strong>Reconocimiento de Imágenes</strong> utiliza modelos de IA 
                multimodales para analizar imágenes y generar descripciones detalladas en 
                lenguaje natural.
              </p>

              <h6 className="mt-4 mb-3">Características:</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Análisis multimodal:</strong> Texto + imagen en una sola consulta
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Modelos soportados:</strong> OpenAI GPT-4o, Google Gemini
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Prompt personalizable:</strong> Adapta la descripción a tu necesidad
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Métricas en tiempo real:</strong> Tokens, latencia
                </li>
                <li>
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Validación temprana:</strong> Advertencia si el modelo no soporta imágenes
                </li>
              </ul>
            </Col>

            <Col md={5}>
              <h6 className="mb-3">Tecnologías</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="primary" className="p-2">Python 3.12</Badge>
                <Badge bg="primary" className="p-2">FastAPI</Badge>
                <Badge bg="primary" className="p-2">SQLModel</Badge>
                <Badge bg="info" className="p-2">React 19</Badge>
                <Badge bg="info" className="p-2">TypeScript</Badge>
                <Badge bg="warning" className="p-2 text-dark">Bootstrap 5 (para que les duela!! jaja)</Badge>
              </div>

              <h6 className="mb-2">📸 Modelos con soporte de imágenes</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="success" className="p-2">
                  <i className="fas fa-robot me-1"></i>OpenAI GPT-4o
                </Badge>
                <Badge bg="success" className="p-2">
                  <i className="fab fa-google me-1"></i>Google Gemini
                </Badge>
              </div>
              <small className="text-muted d-block mb-3">
                Estos modelos tienen capacidad <strong>multimodal nativa</strong>: pueden "ver" 
                imágenes codificadas en base64 y combinarlas con texto en una sola consulta.
              </small>

              <h6 className="mb-2">📝 Modelos sin soporte (texto solo)</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="secondary" className="p-2">
                  <i className="fas fa-times me-1"></i>Mistral
                </Badge>
                <Badge bg="secondary" className="p-2">
                  <i className="fas fa-times me-1"></i>Claude
                </Badge>
                <Badge bg="secondary" className="p-2">
                  <i className="fas fa-times me-1"></i>DeepSeek
                </Badge>
              </div>
              <small className="text-muted d-block">
                Estos modelos solo procesan texto. Para análisis de imágenes necesitarían 
                un servicio externo de OCR o visión por computadora, lo cual no está 
                implementado en esta versión.
              </small>

              <h6 className="mb-2 mt-3">Repositorios</h6>
              <div className="d-grid gap-2 mb-3">
                <a href="https://github.com/peligro/python-demo-ia" target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm text-start">
                  <i className="fab fa-github me-2"></i>Backend (Python/FastAPI)
                </a>
                <a href="https://github.com/peligro/python-demo-ia-react" target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm text-start">
                  <i className="fab fa-github me-2"></i>Frontend (React/TypeScript)
                </a>
              </div>

              <h6 className="mb-2">Archivos del módulo</h6>
              <div className="small">
                <div className="mb-2">
                  <strong className="d-block text-primary mb-1">🐍 Backend (FastAPI)</strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li><code>schemas/image_recognition.py</code></li>
                    <li><code>services/image_recognition/image_recognition_service.py</code></li>
                    <li><code>router/image_recognition/image_recognition_router.py</code></li>
                    <li><code>integraciones/agente_integration.py</code> (métodos analyze_image_*)</li>
                  </ul>
                </div>
                <div>
                  <strong className="d-block text-info mb-1">⚛️ Frontend (React)</strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li><code>src/router.tsx</code> (reutilizado)</li>
                    <li><code>src/modules/portfolio/image_recognition/pages/ImageRecognitionPage.tsx</code></li>
                    <li><code>src/modules/portfolio/image_recognition/services/imageRecognitionService.ts</code></li>
                    <li><code>src/modules/portfolio/image_recognition/interfaces/imageRecognitionInterfaces.ts</code></li>
                  </ul>
                </div>
              </div>
            </Col>
          </Row>

          <hr className="my-4" />

          <Row>
            <Col>
              <h6 className="mb-3">Arquitectura</h6>
              <Row className="g-3">
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-server fa-2x text-primary mb-2"></i>
                    <div className="small fw-bold">Backend</div>
                    <small className="text-muted">FastAPI + SQLModel</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-robot fa-2x text-success mb-2"></i>
                    <div className="small fw-bold">IA Multimodal</div>
                    <small className="text-muted">OpenAI + Gemini</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-code fa-2x text-info mb-2"></i>
                    <div className="small fw-bold">Frontend</div>
                    <small className="text-muted">React + TypeScript</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-database fa-2x text-secondary mb-2"></i>
                    <div className="small fw-bold">DB</div>
                    <small className="text-muted">PostgreSQL</small>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>

          <hr className="my-4" />

          <Row>
            <Col>
              <h6 className="mb-3">Métricas de uso</h6>
              <Row className="g-3">
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h3 mb-0 text-primary">{sessionMetrics.totalAnalyses}</div>
                    <small className="text-muted">Análisis hoy</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h3 mb-0 text-info">{sessionMetrics.avgLatency}ms</div>
                    <small className="text-muted">Latencia promedio</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h3 mb-0 text-success">{sessionMetrics.totalTokens}</div>
                    <small className="text-muted">Tokens totales</small>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAboutModal(false)}>
            <i className="fas fa-times me-2"></i>Cerrar
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
          bg={error ? "danger" : "success"}
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

export default ImageRecognitionPage;