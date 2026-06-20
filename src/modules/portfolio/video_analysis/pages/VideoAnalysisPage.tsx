//src/modules/portfolio/video_analysis/pages/VideoAnalysisPage.tsx
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
import { videoAnalysisService } from "../services/videoAnalysisService";
import type {
  VideoAnalysisRequest,
  VideoAnalysisResponse,
  SessionMetrics,
} from "../interfaces/videoAnalysisInterfaces";

const VideoAnalysisPage = () => {
  const [videoPath] = useState("static/videos/video.mp4");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<VideoAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
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

  const handleAnalyze = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const request: VideoAnalysisRequest = {
        video_path: videoPath,
        prompt: prompt.trim() || undefined,
        model: selectedModel,
      };

      const response = await videoAnalysisService.analyze(request);
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
      console.error("[VideoAnalysis] Error:", err);
      setError(err.response?.data?.detail || "Error al analizar el video");
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
    setPrompt("");
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

  const videoUrl = `${import.meta.env.VITE_API_URL}/${videoPath}`;

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        {/* COLUMNA IZQUIERDA: Analizador de video */}
        <Col lg={8} xl={9}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-video me-2 text-primary"></i>
                Análisis de Video
              </h2>
              <p className="text-muted mb-0">
                Analiza videos con IA para obtener descripciones detalladas del contenido.
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
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </Form.Select>
            </div>
          </div>

          {/* Área de análisis */}
          <Row className="g-3 mb-3">
            {/* Video y prompt */}
            <Col md={7}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-film me-2"></i>Video
                  </h6>
                </Card.Header>
                <Card.Body className="p-3">
                  {/* Reproductor de video */}
                  <div className="mb-3">
                    <video controls className="w-100 rounded" style={{ maxHeight: "300px" }}>
                      <source src={videoUrl} type="video/mp4" />
                      Tu navegador no soporta el elemento de video.
                    </video>
                    <small className="text-muted d-block mt-2">
                      Archivo: video.mp4 • Máximo 20MB
                    </small>
                  </div>

                  {/* Prompt personalizado */}
                  <Form.Group className="mb-3">
                    <Form.Label className="small text-muted">Prompt personalizado (opcional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Describe qué quieres que analice del video..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isLoading}
                      style={{ resize: "none" }}
                    />
                    <Form.Text className="text-muted">
                      Deja en blanco para análisis automático
                    </Form.Text>
                  </Form.Group>

                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleClear}
                      disabled={!result && !error}
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
                    <i className="fas fa-eye me-2"></i>Análisis
                  </h6>
                </Card.Header>
                <Card.Body className="p-3">
                  {isLoading ? (
                    <div className="d-flex align-items-center justify-content-center h-100" style={{ minHeight: "200px" }}>
                      <div className="text-center">
                        <Spinner animation="border" variant="primary" className="mb-2" />
                        <p className="text-muted mb-0">Analizando video...</p>
                        <small className="text-muted">Esto puede tomar unos minutos</small>
                      </div>
                    </div>
                  ) : error ? (
                    <Alert variant="danger">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {error}
                    </Alert>
                  ) : result ? (
                    <div>
                      <div className="p-3 bg-light rounded mb-3" style={{ whiteSpace: "pre-line", maxHeight: "300px", overflowY: "auto" }}>
                        {result.analysis}
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
                        <i className="fas fa-video fa-2x mb-2 opacity-25"></i>
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
                      onClick={() => result && handleCopy(result.analysis)}
                      disabled={!result}
                    >
                      <i className="fas fa-copy me-1"></i>Copiar análisis
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
                    Consejo: Gemini soporta videos de hasta 20MB. Videos más largos pueden tardar más en procesarse.
                  </small>
                </Col>
                <Col md={4} className="text-end">
                  <Button
                    variant="primary"
                    onClick={handleAnalyze}
                    disabled={isLoading}
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
                        Analizar Video
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Información sobre límites */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <i className="fas fa-lightbulb me-2 text-warning"></i>Información
              </h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-2">
                <Col md={6}>
                  <div className="p-2 rounded bg-info bg-opacity-10">
                    <strong className="d-block text-info">🎥 Límites de Gemini</strong>
                    <small className="text-muted">
                      • Máximo 20MB por video<br/>
                      • Formatos: MP4<br/>
                      • Solo Gemini soporta video
                    </small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-2 rounded bg-success bg-opacity-10">
                    <strong className="d-block text-success">✨ Características</strong>
                    <small className="text-muted">
                      • Análisis de escenas<br/>
                      • Detección de objetos<br/>
                      • Descripción de acciones
                    </small>
                  </div>
                </Col>
              </Row>
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
                    sessionMetrics.avgLatency > 30000 ? 100 :
                    (sessionMetrics.avgLatency / 30000) * 100
                  }
                  variant={
                    sessionMetrics.avgLatency > 30000 ? "danger" :
                    sessionMetrics.avgLatency > 15000 ? "warning" : "success"
                  }
                  style={{ height: "8px" }}
                  visuallyHidden
                />
              </div>

              <div className="mb-3">
                <small className="text-muted d-block mb-1">Modelo activo</small>
                <Badge bg="secondary" className="w-100 text-start p-2">
                  <i className="fas fa-microchip me-2"></i>
                  {selectedModel}
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

              {/* Botón Limpiar análisis */}
              {(sessionMetrics.totalAnalyses > 0 || result) && (
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
                  <i className="fas fa-check text-success me-2"></i>Videos &lt; 20MB
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>Formato MP4 recomendado
                </li>
                <li>
                  <i className="fas fa-check text-success me-2"></i>Solo Gemini soporta video
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
            Análisis de Video
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={7}>
              <h5 className="mb-3">¿Qué es este módulo?</h5>
              <p className="text-muted">
                El módulo <strong>Análisis de Video</strong> utiliza Google Gemini para analizar 
                videos y generar descripciones detalladas del contenido visual, incluyendo 
                escenas, personas, objetos y acciones.
              </p>

              <h6 className="mt-4 mb-3">Características:</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Análisis multimodal:</strong> Procesa video + texto
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Solo Gemini:</strong> Único proveedor con soporte de video
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Prompt personalizable:</strong> Adapta el análisis a tu necesidad
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Métricas en tiempo real:</strong> Tokens, latencia
                </li>
                <li>
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Límite 20MB:</strong> Tamaño máximo por video
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

              <h6 className="mb-2">Proveedor soportado</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="success" className="p-2">
                  <i className="fab fa-google me-1"></i>Google Gemini
                </Badge>
              </div>
              <small className="text-muted d-block mb-3">
                Gemini es el único proveedor que soporta análisis de video nativo. 
                Otros proveedores (OpenAI, Claude, Mistral, DeepSeek) solo soportan texto e imágenes.
              </small>

              <h6 className="mb-2">Límites</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="secondary" className="p-2">20MB máx</Badge>
                <Badge bg="secondary" className="p-2">MP4</Badge>
                <Badge bg="secondary" className="p-2">~2 min</Badge>
              </div>

              <h6 className="mb-2">Repositorios</h6>
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
                    <li><code>schemas/video_analysis.py</code></li>
                    <li><code>services/video_analysis/video_analysis_service.py</code></li>
                    <li><code>router/video_analysis/video_analysis_router.py</code></li>
                    <li><code>integraciones/agente_integration.py</code> (analyze_video_gemini)</li>
                  </ul>
                </div>
                <div>
                  <strong className="d-block text-info mb-1">⚛️ Frontend (React)</strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li><code>src/router.tsx</code> (reutilizado)</li>
                    <li><code>src/modules/portfolio/video_analysis/pages/VideoAnalysisPage.tsx</code></li>
                    <li><code>src/modules/portfolio/video_analysis/services/videoAnalysisService.ts</code></li>
                    <li><code>src/modules/portfolio/video_analysis/interfaces/videoAnalysisInterfaces.ts</code></li>
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
                    <i className="fas fa-video fa-2x text-success mb-2"></i>
                    <div className="small fw-bold">IA de Video</div>
                    <small className="text-muted">Google Gemini</small>
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

export default VideoAnalysisPage;