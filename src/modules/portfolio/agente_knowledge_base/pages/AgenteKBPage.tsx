import { useState } from "react";
import { Card, Container, Row, Col, Form, Button, Spinner, Badge, Modal, ProgressBar } from "react-bootstrap";
import { agenteKBService } from "../services/agente_kbService";
import type { ChatMessage } from "../interfaces/agente_kbInterfaces";

// Interface para métricas acumuladas
interface SessionMetrics {
  totalQueries: number;
  totalTokens: number;
  kbQueries: number;
  aiQueries: number;
  avgLatency: number;
  lastQueryTime: Date | null;
}

const AgenteKBPage = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [_, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("mistral-small-latest");
  
  // Métricas de sesión
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalQueries: 0,
    totalTokens: 0,
    kbQueries: 0,
    aiQueries: 0,
    avgLatency: 0,
    lastQueryTime: null,
  });
  
  // Modal "Acerca de"
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Token quota (simulado - en producción vendría del backend)
  const tokenQuota = {
    used: sessionMetrics.totalTokens,
    limit: 100000, // 100k tokens/día
    resetAt: "00:00",
  };
  const tokenUsagePercent = (tokenQuota.used / tokenQuota.limit) * 100;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

   

    try {
      const response = await agenteKBService.query({
        input: userMessage.text,
        model: selectedModel,
      });

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
        const avgLatency = ((prev.avgLatency * prev.totalQueries) + newLatency) / newTotal;
        
        return {
          totalQueries: newTotal,
          totalTokens: prev.totalTokens + (response.metrics?.total_tokens || 0),
          kbQueries: prev.kbQueries + (response.source === "knowledge-base" ? 1 : 0),
          aiQueries: prev.aiQueries + (response.source === "plai-ai" ? 1 : 0),
          avgLatency: Math.round(avgLatency),
          lastQueryTime: new Date(),
        };
      });
    } catch (err: any) {
      console.error("[AgenteKB] Error:", err);
      setError(err.response?.data?.detail || "Error al consultar el agente");
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: "⚠️ No pude procesar tu consulta. Intenta nuevamente.",
        sender: "bot",
        timestamp: new Date(),
        source: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
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
      <Badge bg={c.bg} text={c.text === "KB" ? "light" : "dark"} className="ms-2">
        {c.icon} {c.text}
      </Badge>
    );
  };

  const clearConversation = () => {
    setMessages([]);
    setSessionMetrics({
      totalQueries: 0,
      totalTokens: 0,
      kbQueries: 0,
      aiQueries: 0,
      avgLatency: 0,
      lastQueryTime: null,
    });
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
                Agente Knowledge Base
              </h2>
              <p className="text-muted mb-0">
                Pregúntale a tu base de conocimiento. Si no encuentra la respuesta, consultará a la IA.
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

          {/* Área de mensajes */}
          <Card className="border-0 shadow-sm mb-3" style={{ minHeight: "500px", maxHeight: "65vh" }}>
            <Card.Body className="p-0">
              <div className="p-3" style={{ overflowY: "auto", maxHeight: "calc(65vh - 120px)" }}>
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
                      className={`d-flex mb-3 ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"}`}
                    >
                      <div
                        className={`p-3 rounded-3 ${
                          msg.sender === "user"
                            ? "bg-primary text-white"
                            : "bg-light border"
                        }`}
                        style={{ maxWidth: "80%" }}
                      >
                        <p className="mb-1" style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>{msg.text}</p>
                        
                        {msg.sender === "bot" && (
                          <div className="d-flex align-items-center mt-2 flex-wrap gap-2">
                            <small className="text-muted">
                              <i className="far fa-clock me-1"></i>
                              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </small>
                            {getSourceBadge(msg.source)}
                            {msg.metrics && (
                              <small className="text-muted">
                                <i className="fas fa-bolt me-1"></i>
                                {msg.metrics.latency_ms}ms
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="d-flex justify-content-start mb-3">
                    <div className="p-3 rounded-3 bg-light border">
                      <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                      <small className="text-muted">Pensando...</small>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Input de consulta */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-3">
              <Form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                <Row className="g-2">
                  <Col>
                    <Form.Control
                      type="text"
                      placeholder="Escribe tu pregunta..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isLoading}
                      autoFocus
                    />
                  </Col>
                  <Col xs="auto">
                    <Button 
                      variant="primary" 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                    >
                      {isLoading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <i className="fas fa-paper-plane"></i>
                      )}
                    </Button>
                  </Col>
                </Row>
              </Form>
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
                  <small className="fw-bold">{sessionMetrics.totalTokens.toLocaleString()}</small>
                </div>
                <ProgressBar 
                  now={tokenUsagePercent} 
                  variant={tokenUsagePercent > 90 ? "danger" : tokenUsagePercent > 70 ? "warning" : "success"}
                  style={{ height: "8px" }}
                  label={`${Math.round(tokenUsagePercent)}%`}
                  visuallyHidden
                />
                <small className="text-muted d-block mt-1">
                  Límite: {tokenQuota.limit.toLocaleString()} • Reinicia: {tokenQuota.resetAt}
                </small>
              </div>

              {/* Latencia promedio */}
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small className="text-muted">Latencia promedio</small>
                  <small className="fw-bold">{sessionMetrics.avgLatency}ms</small>
                </div>
                <ProgressBar 
                  now={sessionMetrics.avgLatency > 2000 ? 100 : (sessionMetrics.avgLatency / 2000) * 100}
                  variant={sessionMetrics.avgLatency > 2000 ? "danger" : sessionMetrics.avgLatency > 1000 ? "warning" : "success"}
                  style={{ height: "8px" }}
                  visuallyHidden
                />
              </div>

              {/* Distribución KB vs IA */}
              <div className="mb-3">
                <small className="text-muted d-block mb-2">Fuente de respuestas</small>
                <div className="d-flex gap-2">
                  <div className="flex-grow-1 text-center p-2 rounded bg-success bg-opacity-10">
                    <div className="fw-bold text-success">{sessionMetrics.kbQueries}</div>
                    <small className="text-muted">📚 KB</small>
                  </div>
                  <div className="flex-grow-1 text-center p-2 rounded bg-info bg-opacity-10">
                    <div className="fw-bold text-info">{sessionMetrics.aiQueries}</div>
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
                  <small className="text-muted d-block mb-1">Última consulta</small>
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
                  Usa <kbd>Enter</kbd> para enviar
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>
                  Sé específico en tus preguntas
                </li>
                <li>
                  <i className="fas fa-check text-success me-2"></i>
                  KB es más rápida que IA
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
      Acerca de Agente KB
    </Modal.Title>
  </Modal.Header>
  <Modal.Body className="p-4">
    <Row>
      <Col md={7}>
        <h5 className="mb-3">¿Qué es este módulo?</h5>
        <p className="text-muted">
          El <strong>Agente Knowledge Base</strong> es un asistente inteligente que combina 
          una base de conocimiento estructurada con modelos de IA generativa para proporcionar 
          respuestas rápidas y precisas a tus consultas.
        </p>
        
        <h6 className="mt-4 mb-3">Características principales:</h6>
        <ul className="list-unstyled">
          <li className="mb-2">
            <i className="fas fa-check-circle text-success me-2"></i>
            <strong>Base de Conocimiento:</strong> Respuestas predefinidas con matching por regex
          </li>
          <li className="mb-2">
            <i className="fas fa-check-circle text-success me-2"></i>
            <strong>Fallback a IA:</strong> Si no encuentra en KB, consulta a modelos de IA
          </li>
          <li className="mb-2">
            <i className="fas fa-check-circle text-success me-2"></i>
            <strong>Múltiples proveedores:</strong> Mistral, Gemini, Claude, OpenAI, DeepSeek
          </li>
          <li className="mb-2">
            <i className="fas fa-check-circle text-success me-2"></i>
            <strong>Métricas en tiempo real:</strong> Tokens, latencia, costos
          </li>
          <li>
            <i className="fas fa-check-circle text-success me-2"></i>
            <strong>Auditoría completa:</strong> Todas las consultas se registran
          </li>
        </ul>
      </Col>
      
      <Col md={5}>
        <h6 className="mb-3">Tecnologías</h6>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Badge bg="primary" className="p-2">Python 3.12</Badge>
          <Badge bg="primary" className="p-2">FastAPI</Badge>
          <Badge bg="primary" className="p-2">SQLModel</Badge>
          <Badge bg="primary" className="p-2">Alembic</Badge>
          <Badge bg="primary" className="p-2">PostgreSQL</Badge>
          <Badge bg="info" className="p-2">React 19</Badge>
          <Badge bg="info" className="p-2">TypeScript</Badge>
          <Badge bg="warning" className="p-2 text-dark">Bootstrap 5 (para que les duela!! jaja)</Badge>
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
        <div className="d-grid gap-2">
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
              <small className="text-muted">Python + FastAPI + SQLModel + Alembic</small>
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
              <small className="text-muted">React + Vite + TypeScript</small>
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
    </Container>
  );
};

export default AgenteKBPage;