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
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { chatHistoryService } from "../services/chatHistoryService";
import type {
  ChatMessage,
  ChatHistoryRequest,
  SessionMetrics,
} from "../interfaces/chatHistoryInterfaces";

const ChatHistoryPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("mistral-small-latest");
  const [maxHistory, setMaxHistory] = useState(10);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalChats: 0,
    totalTokens: 0,
    avgLatency: 0,
    lastChatTime: null,
    messagesExchanged: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tokenQuota = {
    used: sessionMetrics.totalTokens,
    limit: 100000,
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
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // Agregar mensaje del usuario inmediatamente
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const request: ChatHistoryRequest = {
        messages: [...messages, userMessage],
        model: selectedModel,
        max_history: maxHistory,
      };

      const response = await chatHistoryService.chat(request);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date(response.timestamp),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Actualizar métricas
      setSessionMetrics((prev) => {
        const newTotal = prev.totalChats + 1;
        const newLatency = response.metrics?.latency_ms || 0;
        return {
          totalChats: newTotal,
          totalTokens: prev.totalTokens + (response.metrics?.total_tokens || 0),
          avgLatency: Math.round(
            (prev.avgLatency * prev.totalChats + newLatency) / newTotal,
          ),
          lastChatTime: new Date(),
          messagesExchanged: prev.messagesExchanged + 2, // user + assistant
        };
      });

      setToastMessage("✅ Respuesta recibida");
      setShowToast(true);
    } catch (err: any) {
      console.error("[ChatHistory] Error:", err);
      setError(err.response?.data?.detail || "Error al obtener respuesta");
      setToastMessage("❌ Error en la conversación");
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage("📋 Copiado al portapapeles");
    setShowToast(true);
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setSessionMetrics((prev) => ({
      ...prev,
      totalChats: 0,
      totalTokens: 0,
      avgLatency: 0,
      messagesExchanged: 0,
    }));
    setToastMessage("🗑️ Conversación reiniciada");
    setShowToast(true);
  };

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        {/* COLUMNA IZQUIERDA: Chat con historial */}
        <Col lg={8} xl={9}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-comments me-2 text-primary"></i>
                Chat con Historial
              </h2>
              <p className="text-muted mb-0">
                Conversación multi-turno con contexto. La IA recuerda lo que
                hablaste antes.
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

          {/* Área de mensajes */}
          <Card
            className="border-0 shadow-sm mb-3"
            style={{ minHeight: "400px", maxHeight: "60vh" }}
          >
            <Card.Body className="p-0">
              <div
                className="p-3"
                style={{ overflowY: "auto", maxHeight: "calc(60vh - 100px)" }}
              >
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="fas fa-comments fa-4x mb-3 opacity-25"></i>
                    <h5 className="mb-2">¡Inicia una conversación!</h5>
                    <p>
                      Escribe tu primer mensaje para comenzar el chat con
                      historial.
                    </p>
                    <small className="d-block">
                      Ej: <em>"Hola, ¿me puedes ayudar con una consulta?"</em>
                    </small>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`d-flex mb-3 ${msg.role === "user" ? "justify-content-end" : "justify-content-start"}`}
                    >
                      <div
                        className={`p-3 rounded-3 ${
                          msg.role === "user"
                            ? "bg-primary text-white"
                            : "bg-light border"
                        }`}
                        style={{ maxWidth: "85%" }}
                      >
                        <p className="mb-1" style={{ whiteSpace: "pre-line" }}>
                          {msg.content}
                        </p>
                        {msg.timestamp && (
                          <small
                            className={`d-block mt-1 ${msg.role === "user" ? "text-white-50" : "text-muted"}`}
                          >
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        )}
                        {msg.role === "assistant" && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 mt-1"
                            onClick={() => handleCopy(msg.content)}
                          >
                            <small>
                              <i className="fas fa-copy me-1"></i>Copiar
                            </small>
                          </Button>
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
                      <small className="text-muted">Escribiendo...</small>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </Card.Body>
          </Card>

          {/* Input de mensaje */}
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
                      placeholder="Escribe tu mensaje..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      style={{ resize: "none" }}
                    />
                  </Col>
                  <Col xs="auto" className="d-flex align-items-center">
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
                    <kbd>Enter</kbd> para enviar • <kbd>Shift+Enter</kbd> para
                    nueva línea
                  </small>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleClear}
                    disabled={messages.length === 0}
                  >
                    <i className="fas fa-trash-alt me-1"></i>Limpiar chat
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Control de historial */}
          <Card className="border-0 shadow-sm mt-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={6}>
                  <small className="text-muted d-block mb-1">
                    Mensajes de contexto
                  </small>
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
                    La IA recibe solo los últimos {maxHistory} mensajes para
                    optimizar tokens
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
                <i className="fas fa-chart-line me-2"></i>Métricas de Sesión
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Intercambios</small>
                  <Badge bg="primary">{sessionMetrics.totalChats}</Badge>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Mensajes</small>
                  <small className="fw-bold">
                    {sessionMetrics.messagesExchanged}
                  </small>
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

              {sessionMetrics.lastChatTime && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">
                    Último mensaje
                  </small>
                  <small className="d-block">
                    {sessionMetrics.lastChatTime.toLocaleTimeString()}
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
          {messages.length > 0 && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleClear}
              className="w-100 mb-3"
            >
              <i className="fas fa-trash-alt me-2"></i>
              Limpiar conversación
            </Button>
          )}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <i className="fas fa-lightbulb me-2 text-warning"></i>Tips
              </h6>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled mb-0 small text-muted">
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>Usa{" "}
                  <kbd>Shift+Enter</kbd> para saltos de línea
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>Limita el
                  historial para ahorrar tokens
                </li>
                <li>
                  <i className="fas fa-check text-success me-2"></i>La IA
                  recuerda el contexto de la conversación actual
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
            Chat con Historial
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={7}>
              <h5 className="mb-3">¿Qué es este módulo?</h5>
              <p className="text-muted">
                El módulo <strong>Chat con Historial</strong> permite
                conversaciones multi-turno donde la IA mantiene el contexto de
                lo hablado anteriormente, similar a un chat real.
              </p>

              <h6 className="mt-4 mb-3">Características:</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Contexto persistente:</strong> La IA "recuerda"
                  mensajes anteriores
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Control de historial:</strong> Limita cuántos mensajes
                  se envían a la IA
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Multi-modelo:</strong> Mistral, Gemini, Claude,
                  OpenAI, DeepSeek
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Métricas en tiempo real:</strong> Tokens, latencia,
                  mensajes
                </li>
                <li>
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Auto-scroll:</strong> La vista sigue el último mensaje
                  automáticamente
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
                  <i className="fab fa-github me-2"></i>Backend (Python/FastAPI)
                </a>
                <a
                  href="https://github.com/peligro/python-demo-ia-react"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark btn-sm text-start"
                >
                  <i className="fab fa-github me-2"></i>Frontend
                  (React/TypeScript)
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
                      <code>schemas/chat_history.py</code>
                    </li>
                    <li>
                      <code>services/chat_history/chat_history_service.py</code>
                    </li>
                    <li>
                      <code>router/chat_history/chat_history_router.py</code>
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
                        src/modules/portfolio/chat_history/pages/ChatHistoryPage.tsx
                      </code>
                    </li>
                    <li>
                      <code>
                        src/modules/portfolio/chat_history/services/chatHistoryService.ts
                      </code>
                    </li>
                    <li>
                      <code>
                        src/modules/portfolio/chat_history/interfaces/chatHistoryInterfaces.ts
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

export default ChatHistoryPage;
