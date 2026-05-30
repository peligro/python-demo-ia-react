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
import { traduccionService } from "../services/traduccionService";
import type {
  Language,
  TranslationRequest,
  SessionMetrics,
} from "../interfaces/traduccionInterfaces";

// Lista completa de idiomas
const LANGUAGES: Language[] = [
  // Europeos
  { code: "en", name: "Inglés", flag: "🇬🇧" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "fr", name: "Francés", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt-BR", name: "Portugués (Brasil)", flag: "🇧🇷" },
  { code: "de", name: "Alemán", flag: "🇩🇪" },
  { code: "ru", name: "Ruso", flag: "🇷🇺" },
  { code: "nl", name: "Holandés", flag: "🇳🇱" },
  { code: "sv", name: "Sueco", flag: "🇸🇪" },
  { code: "pl", name: "Polaco", flag: "🇵🇱" },
  { code: "el", name: "Griego", flag: "🇬🇷" },
  { code: "ca", name: "Catalán", flag: "🇪🇸" },
  { code: "gl", name: "Gallego", flag: "🇪🇸" },
  { code: "eu", name: "Euskera", flag: "🇪🇸" },
  // Asiáticos
  { code: "zh-CN", name: "Chino (Simplificado)", flag: "🇨🇳" },
  { code: "ja", name: "Japonés", flag: "🇯🇵" },
  { code: "ko", name: "Coreano", flag: "🇰🇷" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "th", name: "Tailandés", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamita", flag: "🇻🇳" },
  // Medio Oriente
  { code: "ar", name: "Árabe", flag: "🇸🇦" },
  { code: "he", name: "Hebreo", flag: "🇮🇱" },
  { code: "tr", name: "Turco", flag: "🇹🇷" },
  // Indígenas
  { code: "arn", name: "Mapudungun", flag: "🇨🇱" },
  { code: "qu", name: "Quechua", flag: "🇵🇪" },
  { code: "gn", name: "Guaraní", flag: "🇵🇾" },
  // Clásicos
  { code: "la", name: "Latín", flag: "🏛️" },
];

const TraduccionPage = () => {
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("mistral-small-latest");
  const [selectedTone, setSelectedTone] = useState<"neutral" | "formal" | "casual">("neutral");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalTranslations: 0,
    totalTokens: 0,
    avgLatency: 0,
    lastTranslationTime: null,
  });

  const tokenQuota = {
    used: sessionMetrics.totalTokens,
    limit: 100000,
    resetAt: "00:00",
  };
  const tokenUsagePercent = (tokenQuota.used / tokenQuota.limit) * 100;

  const handleTranslate = async () => {
    if (!originalText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setTranslatedText("");

    try {
      const request: TranslationRequest = {
        text: originalText.trim(),
        source_lang: sourceLang,
        target_lang: targetLang,
        model: selectedModel,
        tone: selectedTone,
      };

      const response = await traduccionService.translate(request);

      setTranslatedText(response.translated_text);

      // Actualizar métricas
      setSessionMetrics((prev) => {
        const newTotal = prev.totalTranslations + 1;
        const newLatency = response.metrics?.latency_ms || 0;
        return {
          totalTranslations: newTotal,
          totalTokens: prev.totalTokens + (response.metrics?.total_tokens || 0),
          avgLatency: Math.round(
            (prev.avgLatency * prev.totalTranslations + newLatency) / newTotal,
          ),
          lastTranslationTime: new Date(),
        };
      });

      // Mostrar toast de éxito
      setToastMessage("✅ Traducción completada");
      setShowToast(true);
    } catch (err: any) {
      console.error("[Traduccion] Error:", err);
      setError(err.response?.data?.detail || "Error al traducir");
      setToastMessage("❌ Error al traducir");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang !== "auto") {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
      // Swap texts if we have a translation
      if (translatedText) {
        setOriginalText(translatedText);
        setTranslatedText("");
      }
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage("📋 Copiado al portapapeles");
    setShowToast(true);
  };

  const handleClear = () => {
    setOriginalText("");
    setTranslatedText("");
    setError(null);
  };

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        {/* COLUMNA IZQUIERDA: Traductor */}
        <Col lg={8} xl={9}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-language me-2 text-primary"></i>
                Traducción de Textos
              </h2>
              <p className="text-muted mb-0">
                Traduce textos a más de 25 idiomas usando IA. Soporta tono formal, casual o neutral.
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

          {/* Área de traducción */}
          <Row className="g-3 mb-3">
            {/* Texto original */}
            <Col md={6}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <div>
                    <Form.Select
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      size="sm"
                      style={{ width: "auto", display: "inline-block" }}
                    >
                      <option value="auto">🔍 Detectar idioma</option>
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <small className="text-muted">
                    {originalText.length}/5000 caracteres
                  </small>
                </Card.Header>
                <Card.Body className="p-0">
                  <Form.Control
                    as="textarea"
                    rows={10}
                    placeholder="Escribe o pega el texto a traducir..."
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    disabled={isLoading}
                    className="border-0"
                    style={{ resize: "none", minHeight: "200px" }}
                  />
                </Card.Body>
                <Card.Footer className="bg-light">
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleCopy(originalText)}
                      disabled={!originalText}
                    >
                      <i className="fas fa-copy me-1"></i>Copiar
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleClear}
                      disabled={!originalText && !translatedText}
                    >
                      <i className="fas fa-trash me-1"></i>Limpiar
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>

            {/* Botón swap y traducción */}
            <Col md={1} className="d-flex align-items-center justify-content-center">
              <Button
                variant="outline-primary"
                className="rounded-circle"
                onClick={handleSwapLanguages}
                disabled={sourceLang === "auto" || isLoading}
                title="Intercambiar idiomas"
              >
                <i className="fas fa-exchange-alt"></i>
              </Button>
            </Col>

            {/* Texto traducido */}
            <Col md={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <Form.Select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    size="sm"
                    style={{ width: "auto", display: "inline-block" }}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </Form.Select>
                  {translatedText && (
                    <Badge bg="success">
                      <i className="fas fa-check me-1"></i>Traducido
                    </Badge>
                  )}
                </Card.Header>
                <Card.Body className="p-0">
                  {isLoading ? (
                    <div className="d-flex align-items-center justify-content-center h-100" style={{ minHeight: "200px" }}>
                      <div className="text-center">
                        <Spinner animation="border" variant="primary" className="mb-2" />
                        <p className="text-muted mb-0">Traduciendo...</p>
                        <small className="text-muted">
                          Usando {selectedModel}
                        </small>
                      </div>
                    </div>
                  ) : error ? (
                    <Alert variant="danger" className="m-3">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {error}
                    </Alert>
                  ) : translatedText ? (
                    <div className="p-3" style={{ whiteSpace: "pre-line", minHeight: "200px" }}>
                      {translatedText}
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted" style={{ minHeight: "200px" }}>
                      <i className="fas fa-arrow-left me-2"></i>
                      La traducción aparecerá aquí
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="bg-light">
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleCopy(translatedText)}
                      disabled={!translatedText}
                    >
                      <i className="fas fa-copy me-1"></i>Copiar
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          </Row>

          {/* Controles adicionales */}
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">Tono</Form.Label>
                    <Form.Select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value as any)}
                      size="sm"
                    >
                      <option value="neutral">🔹 Neutral</option>
                      <option value="formal">💼 Formal</option>
                      <option value="casual">😊 Casual</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block">
                    <i className="fas fa-info-circle me-1"></i>
                    Consejo: Para mejores resultados, usa textos claros y evita jerga muy específica.
                  </small>
                </Col>
                <Col md={2} className="text-end">
                  <Button
                    variant="primary"
                    onClick={handleTranslate}
                    disabled={!originalText.trim() || isLoading}
                    className="w-100"
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Traduciendo...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic me-2"></i>
                        Traducir
                      </>
                    )}
                  </Button>
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
                  <small className="text-muted">Traducciones</small>
                  <Badge bg="primary">{sessionMetrics.totalTranslations}</Badge>
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
                    tokenUsagePercent > 90
                      ? "danger"
                      : tokenUsagePercent > 70
                      ? "warning"
                      : "success"
                  }
                  style={{ height: "8px" }}
                  label={`${Math.round(tokenUsagePercent)}%`}
                  visuallyHidden
                />
                <small className="text-muted d-block mt-1">
                  Límite: {tokenQuota.limit.toLocaleString()} • Reinicia:{" "}
                  {tokenQuota.resetAt}
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
                    sessionMetrics.avgLatency > 3000
                      ? 100
                      : (sessionMetrics.avgLatency / 3000) * 100
                  }
                  variant={
                    sessionMetrics.avgLatency > 3000
                      ? "danger"
                      : sessionMetrics.avgLatency > 1500
                      ? "warning"
                      : "success"
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

              {sessionMetrics.lastTranslationTime && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">
                    Última traducción
                  </small>
                  <small className="d-block">
                    {sessionMetrics.lastTranslationTime.toLocaleTimeString()}
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
                  <i className="fas fa-check text-success me-2"></i>Usa tono{" "}
                  <strong>formal</strong> para documentos oficiales
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>El tono{" "}
                  <strong>casual</strong> es ideal para mensajes y chats
                </li>
                <li>
                  <i className="fas fa-check text-success me-2"></i>
                  Idiomas indígenas tienen soporte limitado, verifica el resultado
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
            Traducción de Textos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={7}>
              <h5 className="mb-3">¿Qué es este módulo?</h5>
              <p className="text-muted">
                El módulo <strong>Traducción de Textos</strong> permite traducir
                contenido entre más de 25 idiomas utilizando modelos de IA de
                última generación, con control de tono y métricas en tiempo
                real.
              </p>

              <h6 className="mt-4 mb-3">Características:</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>+25 idiomas:</strong> Desde inglés hasta mapudungun
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Control de tono:</strong> Formal, casual o neutral
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Detección automática:</strong> Identifica el idioma
                  origen
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Métricas en tiempo real:</strong> Tokens, latencia,
                  costos
                </li>
                <li>
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Historial:</strong> Registro de traducciones (próximamente)
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
                  FastAPI
                </Badge>
                <Badge bg="primary" className="p-2">
                  SQLModel
                </Badge>
                <Badge bg="info" className="p-2">
                  React 19
                </Badge>
                <Badge bg="info" className="p-2">
                  TypeScript
                </Badge>
                <Badge bg="warning" className="p-2 text-dark">
                  Bootstrap 5 (para que les duela!! jaja)
                </Badge>
              </div>

              <h6 className="mb-2">Proveedores de IA</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="success" className="p-2">
                  <i className="fas fa-robot me-1"></i>Mistral AI
                </Badge>
                <Badge bg="success" className="p-2">
                  <i className="fab fa-google me-1"></i>Google Gemini
                </Badge>
                <Badge bg="success" className="p-2">
                  <i className="fas fa-brain me-1"></i>Anthropic Claude
                </Badge>
                <Badge bg="success" className="p-2">
                  <i className="fas fa-brain me-1"></i>OpenAI GPT
                </Badge>
                <Badge bg="success" className="p-2">
                  <i className="fas fa-robot me-1"></i>DeepSeek
                </Badge>
              </div>

              <h6 className="mb-2">Infraestructura</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="secondary" className="p-2">
                  <i className="fab fa-docker me-1"></i>Docker
                </Badge>
                <Badge bg="secondary" className="p-2">
                  <i className="fas fa-database me-1"></i>LocalStack
                </Badge>
                <Badge bg="secondary" className="p-2">
                  <i className="fas fa-bolt me-1"></i>Redis
                </Badge>
              </div>

              <h6 className="mb-2">Repositorios</h6>
              <div className="d-grid gap-2 mb-3">
                <a
                  href="https://github.com/peligro/python-demo-ia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark btn-sm text-start"
                >
                  <i className="fab fa-github me-2"></i>
                  Backend (Python/FastAPI)
                </a>
                <a
                  href="https://github.com/peligro/python-demo-ia-react"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark btn-sm text-start"
                >
                  <i className="fab fa-github me-2"></i>
                  Frontend (React/TypeScript)
                </a>
              </div>

              <h6 className="mb-2">Archivos del módulo</h6>
              <div className="small">
                <div className="mb-2">
                  <strong className="d-block text-primary mb-1">
                    🐍 Backend (FastAPI)
                  </strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li>
                      <code>schemas/traduccion.py</code>
                    </li>
                    <li>
                      <code>services/traduccion/traduccion_service.py</code>
                    </li>
                    <li>
                      <code>router/traduccion/traduccion_router.py</code>
                    </li>
                    <li>
                      <code>integraciones/headers_ia.py</code> (reutilizado)
                    </li>
                    <li>
                      <code>integraciones/agente_kb_integration.py</code>{" "}
                      (reutilizado)
                    </li>
                  </ul>
                </div>
                <div>
                  <strong className="d-block text-info mb-1">
                    ⚛️ Frontend (React)
                  </strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li>
                      <code>src/router.tsx</code> (reutilizado)
                    </li>
                    <li>
                      <code>
                        src/modules/portfolio/traduccion_textos/pages/TraduccionPage.tsx
                      </code>
                    </li>
                    <li>
                      <code>
                        src/modules/portfolio/traduccion_textos/services/traduccionService.ts
                      </code>
                    </li>
                    <li>
                      <code>
                        src/modules/portfolio/traduccion_textos/interfaces/traduccionInterfaces.ts
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

export default TraduccionPage;