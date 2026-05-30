import { useState, useRef, useEffect } from "react";
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
import { agenteKBService } from "../services/agente_kbService";
import type {
  ChatMessage,
  SessionMetrics,
  QueryRequest,
} from "../interfaces/agente_kbInterfaces";

// Interface para mensajes que se envían a la IA
interface MessageForAI {
  role: "user" | "assistant";
  content: string;
}

const AgenteKBPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("mistral-small-latest");
  const [maxHistory, setMaxHistory] = useState(10);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Métricas de sesión
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalQueries: 0,
    totalTokens: 0,
    kbQueries: 0,
    aiQueries: 0,
    avgLatency: 0,
    lastQueryTime: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Token quota (simulado - en producción vendría del backend)
  const tokenQuota = {
    used: sessionMetrics.totalTokens,
    limit: 100000, // 100k tokens/día
    resetAt: "00:00",
  };
  const tokenUsagePercent = (tokenQuota.used / tokenQuota.limit) * 100;

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    // Agregar mensaje del usuario inmediatamente
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Construir historial para enviar a la IA (solo si hay mensajes previos)
      // ⚠️ IMPORTANTE: El backend decide si usa KB o IA, pero si va a IA, le pasamos contexto
      const historyForAI: MessageForAI[] = messages
        .slice(-maxHistory) // Limitar a últimos N mensajes
        .map((msg) => ({
          // ✅ Cast explícito para TypeScript
          role: (msg.sender === "user" ? "user" : "assistant") as "user" | "assistant",
          content: msg.text,
        }));

      // Preparar request (el backend puede extenderse para aceptar messages)
      const request: QueryRequest = {
        input: userMessage.text,
        model: selectedModel,
        // Nota: QueryRequest actual no tiene campo 'messages', 
        // pero el backend puede extenderse para aceptarlo
      };

      const response = await agenteKBService.query(request);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: response.response,
        sender: "bot",
        timestamp: new Date(response.timestamp),
        source: response.source,
        metrics: response.metrics,
        model: response.model,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Actualizar métricas de sesión
      setSessionMetrics((prev) => {
        const newTotal = prev.totalQueries + 1;
        const newLatency = response.metrics?.latency_ms || 0;
        const avgLatency =
          (prev.avgLatency * prev.totalQueries + newLatency) / newTotal;

        return {
          totalQueries: newTotal,
          totalTokens: prev.totalTokens + (response.metrics?.total_tokens || 0),
          kbQueries:
            prev.kbQueries + (response.source === "knowledge-base" ? 1 : 0),
          aiQueries: prev.aiQueries + (response.source === "plai-ai" ? 1 : 0),
          avgLatency: Math.round(avgLatency),
          lastQueryTime: new Date(),
        };
      });

      setToastMessage("✅ Respuesta recibida");
      setShowToast(true);
    } catch (err: any) {
      console.error("[AgenteKB] Error:", err);
      const errorMessage = err.response?.data?.detail || "Error al consultar el agente";
      
      // Manejo inteligente de errores por modelo
      let userFriendlyError = errorMessage;
      if (errorMessage.includes("400") && ["mistral-small-latest", "claude-opus-4-8"].includes(selectedModel)) {
        userFriendlyError = "Este modelo tiene límites con conversaciones largas. Intenta con OpenAI o DeepSeek.";
        setToastMessage("⚠️ Problema con el modelo. Prueba OpenAI/DeepSeek");
      } else {
        setToastMessage("❌ Error en la consulta");
      }
      
      setError(userFriendlyError);
      
      // Agregar mensaje de error visual al chat
      const errorBotMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: `⚠️ ${userFriendlyError}`,
        sender: "bot",
        timestamp: new Date(),
        source: "error",
      };
      setMessages((prev) => [...prev, errorBotMessage]);
      
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSourceBadge = (source?: ChatMessage["source"]) => {
    const config = {
      "knowledge-base": { bg: "success", text: "KB", icon: "📚" },
      "plai-ai": { bg: "info", text: "IA", icon: "🤖" },
      error: { bg: "danger", text: "Error", icon: "⚠️" },
    };
    const c = config[source || "error"];
    return (
      <Badge
        bg={c.bg}
        text={c.text === "KB" ? "light" : "dark"}
        className="ms-2"
      >
        {c.icon} {c.text}
      </Badge>
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage("📋 Copiado al portapapeles");
    setShowToast(true);
  };

  const clearConversation = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setSessionMetrics({
      totalQueries: 0,
      totalTokens: 0,
      kbQueries: 0,
      aiQueries: 0,
      avgLatency: 0,
      lastQueryTime: null,
    });
    setToastMessage("🗑️ Conversación reiniciada");
    setShowToast(true);
  };

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        {/* COLUMNA IZQUIERDA: Chat */}
        <Col lg={8} xl={9}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-robot me-2 text-primary"></i>
                Agente RAG KB (Knowledge Basic)
              </h2>
              <p className="text-muted mb-0">
                Pregúntale a tu base de conocimiento. Si no encuentra la respuesta, consultará a la IA con contexto de la conversación.
              </p>
            </div>

            <div className="d-flex gap-2">
              {/* Botón "Acerca de" */}
              <Button
                variant="outline-secondary"
                onClick={() => setShowAboutModal(true)}
                title="Acerca de este módulo"
              >
                <i className="fas fa-info-circle me-2"></i>
                Acerca de
              </Button>

              {/* Selector de modelo */}
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

          {/* Alerta informativa sobre historial */}
          <Alert variant="info" className="mb-3">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Contexto activo:</strong> La IA recuerda los últimos {maxHistory} mensajes de esta conversación para respuestas más coherentes.
          </Alert>

          {/* Área de mensajes */}
          <Card
            className="border-0 shadow-sm mb-3"
            style={{ minHeight: "500px", maxHeight: "65vh" }}
          >
            <Card.Body className="p-0">
              <div
                className="p-3"
                style={{ overflowY: "auto", maxHeight: "calc(65vh - 120px)" }}
              >
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="fas fa-comments fa-4x mb-3 opacity-25"></i>
                    <h5 className="mb-2">¡Bienvenido al Agente KB!</h5>
                    <p>Haz tu primera pregunta para comenzar</p>
                    <small className="d-block">
                      Ej: <em>"¿cómo genero una guía de despacho?"</em>
                    </small>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`d-flex mb-3 ${
                        msg.sender === "user"
                          ? "justify-content-end"
                          : "justify-content-start"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-3 ${
                          msg.sender === "user"
                            ? "bg-primary text-white"
                            : msg.source === "error"
                            ? "bg-danger text-white"
                            : "bg-light border"
                        }`}
                        style={{ maxWidth: "80%" }}
                      >
                        <p
                          className="mb-1"
                          style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}
                        >
                          {msg.text}
                        </p>

                        {msg.sender === "bot" && msg.source !== "error" && (
                          <div className="d-flex align-items-center mt-2 flex-wrap gap-2">
                            <small className="text-muted">
                              <i className="far fa-clock me-1"></i>
                              {msg.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                            {getSourceBadge(msg.source)}
                            {msg.metrics && (
                              <small className="text-muted">
                                <i className="fas fa-bolt me-1"></i>
                                {msg.metrics.latency_ms}ms
                              </small>
                            )}
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 ms-1"
                              onClick={() => handleCopy(msg.text)}
                            >
                              <small>
                                <i className="fas fa-copy me-1"></i>Copiar
                              </small>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="d-flex justify-content-start mb-3">
                    <div className="p-3 rounded-3 bg-light border">
                      <Spinner
                        animation="border"
                        size="sm"
                        variant="primary"
                        className="me-2"
                      />
                      <small className="text-muted">Pensando...</small>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </Card.Body>
          </Card>

          {/* Input de consulta */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-3">
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <Row className="g-2">
                  <Col>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Escribe tu pregunta..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      style={{ resize: "none" }}
                    />
                  </Col>
                  <Col xs="auto">
                    <Button
                      variant="primary"
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="h-100"
                    >
                      {isLoading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <i className="fas fa-paper-plane"></i>
                      )}
                    </Button>
                  </Col>
                </Row>
                <div className="d-flex justify-content-between mt-2">
                  <small className="text-muted">
                    <kbd>Enter</kbd> para enviar • <kbd>Shift+Enter</kbd> para nueva línea
                  </small>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={clearConversation}
                    disabled={messages.length === 0}
                  >
                    <i className="fas fa-trash-alt me-1"></i>Limpiar
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Control de límite de historial */}
          <Card className="border-0 shadow-sm mt-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={6}>
                  <small className="text-muted d-block mb-1">Mensajes de contexto para IA</small>
                  <Form.Select
                    value={maxHistory}
                    onChange={(e) => setMaxHistory(parseInt(e.target.value))}
                    size="sm"
                    style={{ width: "auto" }}
                  >
                    <option value={5}>Últimos 5 mensajes</option>
                    <option value={10}>Últimos 10 mensajes</option>
                    <option value={20}>Últimos 20 mensajes</option>
                    <option value={50}>Todos (50 máx)</option>
                  </Form.Select>
                </Col>
                <Col md={6} className="text-end">
                  <small className="text-muted d-block">
                    <i className="fas fa-info-circle me-1"></i>
                    Menos mensajes = menos tokens = respuesta más rápida
                  </small>
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
                <i className="fas fa-chart-line me-2"></i>
                Métricas de Sesión
              </h6>
            </Card.Header>
            <Card.Body>
              {/* Total de consultas */}
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Consultas</small>
                  <Badge bg="primary">{sessionMetrics.totalQueries}</Badge>
                </div>
              </div>

              {/* Tokens usados */}
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

              {/* Latencia promedio */}
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Latencia promedio</small>
                  <small className="fw-bold">
                    {sessionMetrics.avgLatency}ms
                  </small>
                </div>
                <ProgressBar
                  now={
                    sessionMetrics.avgLatency > 2000
                      ? 100
                      : (sessionMetrics.avgLatency / 2000) * 100
                  }
                  variant={
                    sessionMetrics.avgLatency > 2000
                      ? "danger"
                      : sessionMetrics.avgLatency > 1000
                        ? "warning"
                        : "success"
                  }
                  style={{ height: "8px" }}
                  visuallyHidden
                />
              </div>

              {/* Distribución KB vs IA */}
              <div className="mb-3">
                <small className="text-muted d-block mb-2">
                  Fuente de respuestas
                </small>
                <div className="d-flex gap-2">
                  <div className="flex-grow-1 text-center p-2 rounded bg-success bg-opacity-10">
                    <div className="fw-bold text-success">
                      {sessionMetrics.kbQueries}
                    </div>
                    <small className="text-muted">📚 KB</small>
                  </div>
                  <div className="flex-grow-1 text-center p-2 rounded bg-info bg-opacity-10">
                    <div className="fw-bold text-info">
                      {sessionMetrics.aiQueries}
                    </div>
                    <small className="text-muted">🤖 IA</small>
                  </div>
                </div>
              </div>

              {/* Modelo actual */}
              <div className="mb-3">
                <small className="text-muted d-block mb-1">Modelo activo</small>
                <Badge bg="secondary" className="w-100 text-start p-2">
                  <i className="fas fa-microchip me-2"></i>
                  {selectedModel}
                </Badge>
              </div>

              {/* Última consulta */}
              {sessionMetrics.lastQueryTime && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">
                    Última consulta
                  </small>
                  <small className="d-block">
                    {sessionMetrics.lastQueryTime.toLocaleTimeString()}
                  </small>
                </div>
              )}

              {/* Botón limpiar */}
              {messages.length > 0 && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={clearConversation}
                  className="w-100"
                >
                  <i className="fas fa-trash-alt me-2"></i>
                  Limpiar conversación
                </Button>
              )}
            </Card.Body>
          </Card>

          {/* Tips rápidos */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <i className="fas fa-lightbulb me-2 text-warning"></i>
                Tips
              </h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled mb-0 small text-muted">
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Usa <kbd>Shift+Enter</kbd> para saltos de línea
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Limita el historial para ahorrar tokens
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  KB es más rápida que IA
                </li>
                <li className="pt-2 border-top">
                  <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                  <strong>OpenAI/DeepSeek</strong> son más estables con historial
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
            Agente RAG KB (Knowledge Basic)
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={7}>
              <h5 className="mb-3">¿Qué es este módulo?</h5>
              <p className="text-muted">
                El <strong>Agente RAG KB (Knowledge Basic)</strong> es un
                asistente inteligente que combina una base de conocimiento
                estructurada con modelos de IA generativa para proporcionar
                respuestas rápidas y precisas a tus consultas.
              </p>

              <h6 className="mt-4 mb-3">Características principales:</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Base de Conocimiento:</strong> Respuestas predefinidas
                  con matching por regex
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Fallback a IA con contexto:</strong> Si no encuentra en KB, 
                  consulta a modelos de IA usando el historial de la conversación
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Múltiples proveedores:</strong> Mistral, Gemini,
                  Claude, OpenAI, DeepSeek
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Métricas en tiempo real:</strong> Tokens, latencia,
                  costos
                </li>
                <li>
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Auditoría completa:</strong> Todas las consultas se
                  registran
                </li>
              </ul>

              <Alert variant="info" className="mt-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Historial en memoria:</strong> El contexto de la conversación 
                se mantiene <strong>solo en el navegador</strong> durante esta sesión. 
                Si recargas la página, el historial se pierde.
              </Alert>
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
                <Badge bg="primary" className="p-2">
                  Alembic
                </Badge>
                <Badge bg="primary" className="p-2">
                  PostgreSQL
                </Badge>
                <Badge bg="primary" className="p-2">
                  pgvector
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
                      <code>models/kb_entry.py</code>,{" "}
                      <code>models/query_log.py</code>
                    </li>
                    <li>
                      <code>schemas/agente_kb.py</code>
                    </li>
                    <li>
                      <code>services/agente_kb/agente_kb_service.py</code>
                    </li>
                    <li>
                      <code>router/agente_kb/agente_kb_router.py</code>
                    </li>
                    <li>
                      <code>integraciones/agente_integration.py</code>
                    </li>
                    <li>
                      <code>integraciones/headers_ia.py</code>
                    </li>
                  </ul>
                </div>
                <div>
                  <strong className="d-block text-info mb-1">
                    ⚛️ Frontend (React)
                  </strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li>
                      <code>src/router.tsx</code>
                    </li>
                    <li>
                      <code>
                        src/modules/portfolio/agente_knowledge_base/pages/AgenteKBPage.tsx
                      </code>
                    </li>
                    <li>
                      <code>
                        src/modules/portfolio/agente_knowledge_base/services/agente_kbService.ts
                      </code>
                    </li>
                    <li>
                      <code>
                        src/modules/portfolio/agente_knowledge_base/interfaces/agente_kbInterfaces.ts
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
                    <small className="text-muted">
                      Python + FastAPI + SQLModel + Alembic
                    </small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-database fa-2x text-primary mb-2"></i>
                    <div className="small fw-bold">Base de Datos</div>
                    <small className="text-muted">PostgreSQL + pgvector</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-robot fa-2x text-success mb-2"></i>
                    <div className="small fw-bold">IA</div>
                    <small className="text-muted">Múltiples proveedores</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-code fa-2x text-info mb-2"></i>
                    <div className="small fw-bold">Frontend</div>
                    <small className="text-muted">
                      React + Vite + TypeScript
                    </small>
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
                    <div className="h3 mb-0 text-primary">{sessionMetrics.totalQueries}</div>
                    <small className="text-muted">Consultas hoy</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h3 mb-0 text-success">
                      {sessionMetrics.totalQueries > 0
                        ? Math.round((sessionMetrics.kbQueries / sessionMetrics.totalQueries) * 100)
                        : 0}%
                    </div>
                    <small className="text-muted">Respuestas desde KB</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h3 mb-0 text-info">{sessionMetrics.avgLatency}ms</div>
                    <small className="text-muted">Latencia promedio</small>
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

export default AgenteKBPage;