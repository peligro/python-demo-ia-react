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
  Table,
} from "react-bootstrap";
import { generateSqlService } from "../services/generateSqlService";
import type {
  GenerateSQLRequest,
  GenerateSQLResponse,
  SessionMetrics,
  SQLDialect,
} from "../interfaces/generateSqlInterfaces";

const DIALECTS: { value: SQLDialect; label: string; icon: string }[] = [
  { value: "postgresql", label: "PostgreSQL", icon: "🐘" },
  { value: "mysql", label: "MySQL", icon: "🐬" },
  { value: "sqlite", label: "SQLite", icon: "🗄️" },
  { value: "mssql", label: "SQL Server", icon: "🪟" },
];

const TABLE_COLUMNS = [
  { name: "id", type: "int", description: "ID único, primary key" },
  { name: "name", type: "string", description: "Nombre completo" },
  { name: "correo", type: "string", description: "Email del usuario" },
  { name: "password", type: "string", description: "Password (hash)" },
  { name: "state", type: "int", description: "1=activo, 0=inactivo" },
  { name: "created_ut", type: "datetime", description: "Fecha de creación" },
  { name: "updated_at", type: "datetime", description: "Última actualización" },
  { name: "phone", type: "string", description: "Teléfono" },
];

const EXAMPLE_QUESTIONS = [
  "Muéstrame los usuarios activos",
  "¿Cuántos usuarios se registraron hoy?",
  "Busca usuarios con correo de gmail",
  "Lista los nombres y teléfonos ordenados por nombre",
  "Usuarios creados en el último mes",
];

const GenerateSQLPage = () => {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<GenerateSQLResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("mistral-small-latest");
  const [selectedDialect, setSelectedDialect] = useState<SQLDialect>("postgresql");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalGenerations: 0,
    totalTokens: 0,
    avgLatency: 0,
    lastGenerationTime: null,
  });

  const tokenQuota = {
    used: sessionMetrics.totalTokens,
    limit: 100000,
    resetAt: "00:00",
  };
  const tokenUsagePercent = (tokenQuota.used / tokenQuota.limit) * 100;

  const handleGenerate = async () => {
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const request: GenerateSQLRequest = {
        question: question.trim(),
        model: selectedModel,
        dialect: selectedDialect,
      };

      const response = await generateSqlService.generate(request);
      setResult(response);

      // Actualizar métricas
      setSessionMetrics((prev) => {
        const newTotal = prev.totalGenerations + 1;
        const newLatency = response.metrics?.latency_ms || 0;
        return {
          totalGenerations: newTotal,
          totalTokens: prev.totalTokens + (response.metrics?.total_tokens || 0),
          avgLatency: Math.round(
            (prev.avgLatency * prev.totalGenerations + newLatency) / newTotal,
          ),
          lastGenerationTime: new Date(),
        };
      });

      setToastMessage("✅ SQL generado");
      setShowToast(true);
    } catch (err: any) {
      console.error("[GenerateSQL] Error:", err);
      setError(err.response?.data?.detail || "Error al generar SQL");
      setToastMessage("❌ Error al generar");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage("📋 SQL copiado");
    setShowToast(true);
  };

  const handleClear = () => {
    setQuestion("");
    setResult(null);
    setError(null);
  };

  const handleExampleClick = (example: string) => {
    setQuestion(example);
  };

  return (
    <Container fluid className="py-4">
      <Row className="g-4">
        {/* COLUMNA IZQUIERDA: Generador */}
        <Col lg={8} xl={9}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-database me-2 text-primary"></i>
                Generate SQL
              </h2>
              <p className="text-muted mb-0">
                Escribe en lenguaje natural y obtén la consulta SQL para la tabla <code>usuarios</code>.
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

          {/* Área de generación */}
          <Row className="g-3 mb-3">
            {/* Input de pregunta */}
            <Col md={7}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <div>
                    <Form.Select
                      value={selectedDialect}
                      onChange={(e) => setSelectedDialect(e.target.value as SQLDialect)}
                      size="sm"
                      style={{ width: "auto", display: "inline-block" }}
                    >
                      {DIALECTS.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.icon} {d.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <small className="text-muted">
                    {question.length}/500 caracteres
                  </small>
                </Card.Header>
                <Card.Body className="p-0">
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Ej: 'Muéstrame los usuarios activos de Santiago'..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={isLoading}
                    className="border-0"
                    style={{ resize: "none", minHeight: "120px" }}
                  />
                </Card.Body>
                <Card.Footer className="bg-light">
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleCopy(question)}
                      disabled={!question}
                    >
                      <i className="fas fa-copy me-1"></i>Copiar
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleClear}
                      disabled={!question && !result}
                    >
                      <i className="fas fa-trash me-1"></i>Limpiar
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>

            {/* Resultado SQL */}
            <Col md={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-code me-2"></i>Consulta SQL
                  </h6>
                </Card.Header>
                <Card.Body className="p-0">
                  {isLoading ? (
                    <div className="d-flex align-items-center justify-content-center h-100" style={{ minHeight: "120px" }}>
                      <div className="text-center">
                        <Spinner animation="border" variant="primary" className="mb-2" />
                        <p className="text-muted mb-0">Generando SQL...</p>
                        <small className="text-muted">Usando {selectedModel}</small>
                      </div>
                    </div>
                  ) : error ? (
                    <Alert variant="danger" className="m-3">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      {error}
                    </Alert>
                  ) : result ? (
                    <div className="p-3">
                      <pre className="bg-dark text-light p-3 rounded small mb-2" style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
                        {result.sql_query}
                      </pre>
                      
                      {result.explanation && (
                        <small className="text-muted d-block mb-2">
                          <i className="fas fa-info-circle me-1"></i>
                          {result.explanation}
                        </small>
                      )}
                      
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
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted" style={{ minHeight: "120px" }}>
                      <div className="text-center">
                        <i className="fas fa-terminal fa-2x mb-2 opacity-25"></i>
                        <p className="mb-0">El SQL aparecerá aquí</p>
                      </div>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="bg-light">
                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => result && handleCopy(result.sql_query)}
                      disabled={!result}
                    >
                      <i className="fas fa-copy me-1"></i>Copiar SQL
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          </Row>

          {/* Botón de generación */}
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <small className="text-muted d-block">
                    <i className="fas fa-info-circle me-1"></i>
                    Consejo: Sé específico. Ej: "usuarios activos" en lugar de solo "usuarios".
                  </small>
                </Col>
                <Col md={4} className="text-end">
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    disabled={!question.trim() || isLoading}
                    className="w-100"
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magic me-2"></i>
                        Generar SQL
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
                {EXAMPLE_QUESTIONS.map((example, idx) => (
                  <Button
                    key={idx}
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleExampleClick(example)}
                    className="flex-grow-1"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Schema de referencia */}
          <Card className="border-0 shadow-sm mt-3">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <i className="fas fa-table me-2"></i>Esquema: tabla <code>usuarios</code>
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover size="sm" className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Columna</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_COLUMNS.map((col) => (
                    <tr key={col.name}>
                      <td><code>{col.name}</code></td>
                      <td><Badge bg="secondary">{col.type}</Badge></td>
                      <td className="text-muted small">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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
                  <small className="text-muted">Generaciones</small>
                  <Badge bg="primary">{sessionMetrics.totalGenerations}</Badge>
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

              <div className="mb-3">
                <small className="text-muted d-block mb-1">Modelo activo</small>
                <Badge bg="secondary" className="w-100 text-start p-2">
                  <i className="fas fa-microchip me-2"></i>
                  {selectedModel}
                </Badge>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block mb-1">Dialecto SQL</small>
                <Badge bg="info" className="w-100 text-start p-2">
                  <i className="fas fa-code me-2"></i>
                  {DIALECTS.find(d => d.value === selectedDialect)?.label}
                </Badge>
              </div>

              {sessionMetrics.lastGenerationTime && (
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">Última generación</small>
                  <small className="d-block">
                    {sessionMetrics.lastGenerationTime.toLocaleTimeString()}
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
                  <i className="fas fa-check text-success me-2"></i>Usa filtros específicos: "activos", "con gmail", etc.
                </li>
                <li className="mb-2">
                  <i className="fas fa-check text-success me-2"></i>La columna <code>state</code> controla activos (1) / inactivos (0)
                </li>
                <li>
                  <i className="fas fa-check text-success me-2"></i>Por defecto, los resultados se ordenan por <code>id DESC</code>
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
            Generate SQL
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={7}>
              <h5 className="mb-3">¿Qué es este módulo?</h5>
              <p className="text-muted">
                El módulo <strong>Generate SQL</strong> utiliza modelos de IA 
                para convertir preguntas en lenguaje natural a consultas SQL 
                válidas para la tabla <code>usuarios</code>.
              </p>

              <h6 className="mt-4 mb-3">Características:</h6>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Generación automática:</strong> Pregunta → SQL válido
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Múltiples dialectos:</strong> PostgreSQL, MySQL, SQLite, SQL Server
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Schema integrado:</strong> Columnas y tipos predefinidos
                </li>
                <li className="mb-2">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Explicación opcional:</strong> Breve razonamiento del SQL generado
                </li>
                <li>
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <strong>Métricas en tiempo real:</strong> Tokens, latencia
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
                    <li><code>schemas/generate_sql.py</code></li>
                    <li><code>services/generate_sql/generate_sql_service.py</code></li>
                    <li><code>router/generate_sql/generate_sql_router.py</code></li>
                    <li><code>integraciones/headers_ia.py</code> (reutilizado)</li>
                    <li><code>integraciones/agente_kb_integration.py</code> (reutilizado)</li>
                  </ul>
                </div>
                <div>
                  <strong className="d-block text-info mb-1">⚛️ Frontend (React)</strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li><code>src/router.tsx</code> (reutilizado)</li>
                    <li><code>src/modules/portfolio/generate_sql/pages/GenerateSQLPage.tsx</code></li>
                    <li><code>src/modules/portfolio/generate_sql/services/generateSqlService.ts</code></li>
                    <li><code>src/modules/portfolio/generate_sql/interfaces/generateSqlInterfaces.ts</code></li>
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

export default GenerateSQLPage;