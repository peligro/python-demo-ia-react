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
import { analisisSentimientoService } from "../services/analisisSentimientoService";
import type {
  SentimentAnalysisRequest,
  SentimentAnalysisResponse,
  SessionMetrics,
  SentimentType,
} from "../interfaces/analisisSentimientoInterfaces";

const AnalisisSentimientoPage = () => {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<SentimentAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("mistral-small-latest");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalAnalyses: 0,
    totalTokens: 0,
    avgLatency: 0,
    lastAnalysisTime: null,
    sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
  });

  const tokenQuota = {
    used: sessionMetrics.totalTokens,
    limit: 100000,
    resetAt: "00:00",
  };
  const tokenUsagePercent = (tokenQuota.used / tokenQuota.limit) * 100;

  const getSentimentBadge = (sentiment: SentimentType) => {
    const config = {
      positive: { bg: "success", text: "Positivo", icon: "😊", class: "bg-success" },
      negative: { bg: "danger", text: "Negativo", icon: "😔", class: "bg-danger" },
      neutral: { bg: "warning", text: "Neutral", icon: "😐", class: "bg-warning" },
    };
    return config[sentiment];
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const request: SentimentAnalysisRequest = {
        text: inputText.trim(),
        model: selectedModel,
      };

      const response = await analisisSentimientoService.analyze(request);
      setResult(response);

      // Actualizar métricas
      setSessionMetrics((prev) => {
        const newTotal = prev.totalAnalyses + 1;
        const newLatency = response.metrics?.latency_ms || 0;
        const distribution = { ...prev.sentimentDistribution };
        distribution[response.sentiment] = (distribution[response.sentiment] || 0) + 1;
        
        return {
          totalAnalyses: newTotal,
          totalTokens: prev.totalTokens + (response.metrics?.total_tokens || 0),
          avgLatency: Math.round(
            (prev.avgLatency * prev.totalAnalyses + newLatency) / newTotal,
          ),
          lastAnalysisTime: new Date(),
          sentimentDistribution: distribution,
        };
      });

      setToastMessage("✅ Análisis completado");
      setShowToast(true);
    } catch (err: any) {
      console.error("[AnalisisSentimiento] Error:", err);
      setError(err.response?.data?.detail || "Error al analizar");
      setToastMessage("❌ Error al analizar");
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
    setInputText("");
    setResult(null);
    setError(null);
  };

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        {/* COLUMNA IZQUIERDA: Analizador */}
        <Col lg={8} xl={9}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-heart me-2 text-danger"></i>
                Análisis de Sentimiento
              </h2>
              <p className="text-muted mb-0">
                Analiza textos y detecta si expresan emociones positivas, negativas o neutrales usando IA.
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
                <option value="mistral-small-latest">Mistral Small</option>
                <option value="gemini-3.5-flash">Gemini-3.5-flash</option>
                <option value="claude-opus-4-8">Claude 4 Opus</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="deepseek-chat">DeepSeek Chat</option>
              </Form.Select>
            </div>
          </div>

          {/* Área de análisis */}
          <Row className="g-3 mb-3">
            {/* Input de texto */}
            <Col md={7}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {inputText.length}/2000 caracteres
                  </small>
                </Card.Header>
                <Card.Body className="p-0">
                  <Form.Control
                    as="textarea"
                    rows={8}
                    placeholder="Escribe o pega el texto a analizar..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isLoading}
                    className="border-0"
                    style={{ resize: "none", minHeight: "180px" }}
                  />
                </Card.Body>
                <Card.Footer className="bg-light">
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleCopy(inputText)}
                      disabled={!inputText}
                    >
                      <i className="fas fa-copy me-1"></i>Copiar
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleClear}
                      disabled={!inputText && !result}
                    >
                      <i className="fas fa-trash me-1"></i>Limpiar
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>

            {/* Resultado */}
            <Col md={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-chart-pie me-2"></i>Resultado
                  </h6>
                </Card.Header>
                <Card.Body className="p-3">
                  {isLoading ? (
                    <div className="d-flex align-items-center justify-content-center h-100" style={{ minHeight: "180px" }}>
                      <div className="text-center">
                        <Spinner animation="border" variant="primary" className="mb-2" />
                        <p className="text-muted mb-0">Analizando sentimiento...</p>
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
                      {/* Badge de sentimiento */}
                      <div className="text-center mb-3">
                        {(() => {
                          const config = getSentimentBadge(result.sentiment);
                          return (
                            <Badge 
                              bg={config.bg} 
                              pill 
                              className="p-3 fs-5"
                            >
                              <i className={`fas fa-${config.icon === "😊" ? "smile" : config.icon === "😔" ? "frown" : "meh"} me-2`}></i>
                              {config.text}
                            </Badge>
                          );
                        })()}
                      </div>

                      {/* Confianza */}
                      {result.confidence !== undefined && (
                        <div className="mb-3">
                          <small className="text-muted d-block mb-1">Confianza</small>
                          <ProgressBar 
                            now={result.confidence * 100} 
                            variant={
                              result.confidence > 0.8 ? "success" : 
                              result.confidence > 0.6 ? "info" : "warning"
                            }
                            label={`${Math.round(result.confidence * 100)}%`}
                            style={{ height: "10px" }}
                          />
                        </div>
                      )}

                      {/* Explicación */}
                      {result.explanation && (
                        <div className="mb-3">
                          <small className="text-muted d-block mb-1">Análisis</small>
                          <p className="small mb-0">{result.explanation}</p>
                        </div>
                      )}

                      {/* Métricas */}
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
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted" style={{ minHeight: "180px" }}>
                      <div className="text-center">
                        <i className="fas fa-heart fa-2x mb-2 opacity-25"></i>
                        <p className="mb-0">El resultado aparecerá aquí</p>
                      </div>
                    </div>
                  )}
                </Card.Body>
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
                    Consejo: Textos más largos y específicos dan mejores resultados.
                  </small>
                </Col>
                <Col md={4} className="text-end">
                  <Button
                    variant="primary"
                    onClick={handleAnalyze}
                    disabled={!inputText.trim() || isLoading}
                    className="w-100"
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-heart me-2"></i>
                        Analizar Sentimiento
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Ejemplos rápidos */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <i className="fas fa-lightbulb me-2 text-warning"></i>Ejemplos
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                {[
                  "¡Me encanta este producto, superó mis expectativas!",
                  "El servicio fue terrible, nunca volveré.",
                  "Recibí el paquete ayer, todo en orden."
                ].map((example, idx) => (
                  <Button
                    key={idx}
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setInputText(example)}
                    className="flex-grow-1"
                  >
                    {example.substring(0, 40)}...
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
                    sessionMetrics.avgLatency > 3000 ? 100 :
                    (sessionMetrics.avgLatency / 3000) * 100
                  }
                  variant={
                    sessionMetrics.avgLatency > 3000 ? "danger" :
                    sessionMetrics.avgLatency > 1500 ? "warning" : "success"
                  }
                  style={{ height: "8px" }}
                  visuallyHidden
                />
              </div>

              {/* Distribución de sentimientos */}
              <div className="mb-3">
                <small className="text-muted d-block mb-2">Distribución</small>
                <div className="d-flex gap-1">
                  <div className="flex-grow-1 text-center p-2 rounded bg-success bg-opacity-10">
                    <div className="fw-bold text-success">{sessionMetrics.sentimentDistribution.positive}</div>
                    <small className="text-muted">😊</small>
                  </div>
                  <div className="flex-grow-1 text-center p-2 rounded bg-danger bg-opacity-10">
                    <div className="fw-bold text-danger">{sessionMetrics.sentimentDistribution.negative}</div>
                    <small className="text-muted">😔</small>
                  </div>
                  <div className="flex-grow-1 text-center p-2 rounded bg-warning bg-opacity-10">
                    <div className="fw-bold text-dark">{sessionMetrics.sentimentDistribution.neutral}</div>
                    <small className="text-muted">😐</small>
                  </div>
                </div>
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
                  <i className="fas fa-check text-success me-2"></i>Usa textos completos para mejor precisión
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>Selecciona el idioma correcto del texto
                </li>
                <li>
                  <i className="fas fa-check text-success me-2"></i>La confianza mayor de 80% indica alta certeza
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
            Análisis de Sentimiento
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={7}>
              <h5 className="mb-3">¿Qué es este módulo?</h5>
              <p className="text-muted">
                El módulo <strong>Análisis de Sentimiento</strong> utiliza modelos de IA 
                para clasificar automáticamente el tono emocional de textos, identificando 
                si expresan sentimientos positivos, negativos o neutrales.
              </p>

              <h6 className="mt-4 mb-3">Características:</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Clasificación automática:</strong> Positivo 🔹, Negativo 🔴, Neutral 🟡
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Score de confianza:</strong> Indicador de certeza del análisis
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Explicación del análisis:</strong> Breve razonamiento del resultado
                </li>
                <li>
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Métricas en tiempo real:</strong> Tokens, latencia, distribución
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

              <h6 className="mb-2">Proveedores de IA</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="success" className="p-2"><i className="fas fa-robot me-1"></i>Mistral AI</Badge>
                <Badge bg="success" className="p-2"><i className="fab fa-google me-1"></i>Google Gemini</Badge>
                <Badge bg="success" className="p-2"><i className="fas fa-brain me-1"></i>Anthropic Claude</Badge>
                <Badge bg="success" className="p-2"><i className="fas fa-brain me-1"></i>OpenAI GPT</Badge>
                <Badge bg="success" className="p-2"><i className="fas fa-robot me-1"></i>DeepSeek</Badge>
              </div>

              <h6 className="mb-2">Infraestructura</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="secondary" className="p-2"><i className="fab fa-docker me-1"></i>Docker</Badge>
                <Badge bg="secondary" className="p-2"><i className="fas fa-database me-1"></i>LocalStack</Badge>
                <Badge bg="secondary" className="p-2"><i className="fas fa-bolt me-1"></i>Redis</Badge>
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
                    <li><code>schemas/analisis_sentimiento.py</code></li>
                    <li><code>services/analisis_sentimiento/analisis_sentimiento_service.py</code></li>
                    <li><code>router/analisis_sentimiento/analisis_sentimiento_router.py</code></li>
                    <li><code>integraciones/headers_ia.py</code> (reutilizado)</li>
                    <li><code>integraciones/agente_kb_integration.py</code> (reutilizado)</li>
                  </ul>
                </div>
                <div>
                  <strong className="d-block text-info mb-1">⚛️ Frontend (React)</strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li><code>src/router.tsx</code> (reutilizado)</li>
                    <li><code>src/modules/portfolio/analisis_sentimiento/pages/AnalisisSentimientoPage.tsx</code></li>
                    <li><code>src/modules/portfolio/analisis_sentimiento/services/analisisSentimientoService.ts</code></li>
                    <li><code>src/modules/portfolio/analisis_sentimiento/interfaces/analisisSentimientoInterfaces.ts</code></li>
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
                    <div className="small fw-bold">IA</div>
                    <small className="text-muted">5 proveedores</small>
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

        
        </Modal.Body>
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

export default AnalisisSentimientoPage;