import { useState, useEffect } from "react";
import {
  Card,
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Badge,
  Table,
  Modal,
  Alert,
  Toast,
  ToastContainer,
  Pagination as BSPagination,
} from "react-bootstrap";
import { agenteKBLogsService } from "../services/agenteKBLogsService";
import type { QueryLog, LogsFilters, Pagination } from "../interfaces/agente_kbLogsInterfaces";

const AgenteKBLogsPage = () => {
  const [logs, setLogs] = useState<QueryLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    per_page: 20,
    total_records: 0,
    total_pages: 0,
  });
  const [filters, setFilters] = useState<LogsFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<QueryLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Cargar logs al montar o cambiar filtros/paginación
  useEffect(() => {
    fetchLogs();
  }, [pagination.page, pagination.per_page, filters]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await agenteKBLogsService.getLogs(
        filters,
        pagination.page,
        pagination.per_page
      );
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error("[AgenteKBLogs] Error:", err);
      setError(err.response?.data?.detail || "Error al cargar logs");
      setToastMessage("❌ Error al cargar registros");
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof LogsFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Resetear a página 1 al filtrar
  };

  const handleClearFilters = () => {
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
    setToastMessage("🗑️ Filtros limpiados");
    setShowToast(true);
  };

  const handleExportCSV = () => {
    // Exportar logs visibles a CSV
    const headers = [
      "Fecha",
      "Consulta",
      "Fuente",
      "Modelo",
      "Tokens",
      "Latencia",
      "KB Match",
    ];
    const rows = logs.map((log) => [
      new Date(log.created_at).toLocaleString(),
      log.query,
      log.response_source,
      log.ai_model_name || "-",
      log.total_tokens || 0,
      `${log.latency_ms || 0}ms`,
      log.kb_matched ? "✅" : "❌",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agente-kb-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setToastMessage("📥 CSV exportado");
    setShowToast(true);
  };

  const getSourceBadge = (source: QueryLog["response_source"]) => {
    const config = {
      "knowledge-base": { bg: "success", text: "KB", icon: "📚" },
      "plai-ai": { bg: "info", text: "IA", icon: "🤖" },
      error: { bg: "danger", text: "Error", icon: "⚠️" },
    };
    const c = config[source];
    return (
      <Badge bg={c.bg} text={c.text === "KB" ? "light" : "dark"}>
        {c.icon} {c.text}
      </Badge>
    );
  };

  const formatLatency = (ms: number | null) => {
    if (ms == null) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <Container fluid className="py-4">
      {/* Header - Full width */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-clipboard-list me-2 text-primary"></i>
                Logs - Agente RAG KB
              </h2>
              <p className="text-muted mb-0">
                Auditoría de consultas: KB matching, fallback a IA, métricas de consumo.
              </p>
            </div>
            <Button variant="outline-secondary" href="/portfolio/agente-kb">
              <i className="fas fa-arrow-left me-2"></i>Volver al Agente
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filtros - Full width */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small text-muted">Fecha inicio</Form.Label>
                    <Form.Control
                      type="date"
                      value={filters.start_date?.split("T")[0] || ""}
                      onChange={(e) =>
                        handleFilterChange("start_date", e.target.value)
                      }
                      size="sm"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small text-muted">Fecha fin</Form.Label>
                    <Form.Control
                      type="date"
                      value={filters.end_date?.split("T")[0] || ""}
                      onChange={(e) =>
                        handleFilterChange("end_date", e.target.value)
                      }
                      size="sm"
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small text-muted">Fuente</Form.Label>
                    <Form.Select
                      value={filters.source || ""}
                      onChange={(e) =>
                        handleFilterChange("source", e.target.value || undefined)
                      }
                      size="sm"
                    >
                      <option value="">Todos</option>
                      <option value="knowledge-base">📚 KB</option>
                      <option value="plai-ai">🤖 IA</option>
                      <option value="error">⚠️ Error</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small text-muted">Modelo</Form.Label>
                    <Form.Select
                      value={filters.model || ""}
                      onChange={(e) =>
                        handleFilterChange("model", e.target.value || undefined)
                      }
                      size="sm"
                    >
                      <option value="">Todos</option>
                      <option value="mistral-small-latest">Mistral</option>
                      <option value="gemini-3.5-flash">Gemini</option>
                      <option value="claude-opus-4-8">Claude</option>
                      <option value="gpt-4o-mini">OpenAI</option>
                      <option value="deepseek-chat">DeepSeek</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small text-muted">Búsqueda</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Buscar..."
                      value={filters.search || ""}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value || undefined)
                      }
                      size="sm"
                    />
                  </Form.Group>
                </Col>
                <Col md={12} className="d-flex justify-content-end gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={handleClearFilters}>
                    <i className="fas fa-eraser me-1"></i>Limpiar
                  </Button>
                  <Button variant="outline-success" size="sm" onClick={handleExportCSV}>
                    <i className="fas fa-file-csv me-1"></i>Exportar CSV
                  </Button>
                  <Button variant="primary" size="sm" onClick={fetchLogs}>
                    <i className="fas fa-filter me-1"></i>Aplicar
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabla de logs - Full width */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              {isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-2">Cargando registros...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="m-3">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </Alert>
              ) : logs.length === 0 ? (
                <Alert variant="info" className="m-3">
                  <i className="fas fa-info-circle me-2"></i>
                  No se encontraron registros con los filtros aplicados.
                </Alert>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Consulta</th>
                          <th>Fuente</th>
                          <th>Modelo</th>
                          <th>Tokens</th>
                          <th>Latencia</th>
                          <th>KB</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id}>
                            <td>
                              <small>
                                {new Date(log.created_at).toLocaleString()}
                              </small>
                            </td>
                            <td style={{ maxWidth: "250px" }}>
                              <small className="text-truncate d-block" title={log.query}>
                                {log.query}
                              </small>
                            </td>
                            <td>{getSourceBadge(log.response_source)}</td>
                            <td>
                              <small>{log.ai_model_name || "-"}</small>
                            </td>
                            <td>
                              <small>{log.total_tokens?.toLocaleString() || 0}</small>
                            </td>
                            <td>
                              <small>{formatLatency(log.latency_ms)}</small>
                            </td>
                            <td>
                              <Badge
                                bg={log.kb_matched ? "success" : "secondary"}
                                text={log.kb_matched ? "light" : "dark"}
                              >
                                {log.kb_matched ? "✅" : "❌"}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setSelectedLog(log);
                                  setShowDetailModal(true);
                                }}
                              >
                                <i className="fas fa-eye"></i>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Paginación */}
                  <Card.Footer className="bg-light">
                    <Row className="align-items-center">
                      <Col>
                        <small className="text-muted">
                          Mostrando{" "}
                          <strong>
                            {(pagination.page - 1) * pagination.per_page + 1}-
                            {Math.min(
                              pagination.page * pagination.per_page,
                              pagination.total_records
                            )}
                          </strong>{" "}
                          de <strong>{pagination.total_records}</strong> registros
                        </small>
                      </Col>
                      <Col className="text-end">
                        <BSPagination className="mb-0 justify-content-end">
                          <BSPagination.Prev
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                          />
                          {[...Array(pagination.total_pages)].map((_, i) => {
                            const page = i + 1;
                            // Mostrar solo páginas cercanas a la actual
                            if (
                              page === 1 ||
                              page === pagination.total_pages ||
                              (page >= pagination.page - 2 && page <= pagination.page + 2)
                            ) {
                              return (
                                <BSPagination.Item
                                  key={page}
                                  active={page === pagination.page}
                                  onClick={() => handlePageChange(page)}
                                >
                                  {page}
                                </BSPagination.Item>
                              );
                            }
                            if (
                              page === pagination.page - 3 ||
                              page === pagination.page + 3
                            ) {
                              return (
                                <BSPagination.Ellipsis key={`ellipsis-${page}`} disabled />
                              );
                            }
                            return null;
                          })}
                          <BSPagination.Next
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.total_pages}
                          />
                        </BSPagination>
                      </Col>
                    </Row>
                  </Card.Footer>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de detalle */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-search me-2"></i>
            Detalle de Consulta
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <Row className="g-3">
              <Col md={6}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h6 className="mb-3">
                      <i className="fas fa-info-circle me-2"></i>Metadata
                    </h6>
                    <dl className="row mb-0 small">
                      <dt className="col-5">ID</dt>
                      <dd className="col-7">{selectedLog.id}</dd>

                      <dt className="col-5">Fecha</dt>
                      <dd className="col-7">
                        {new Date(selectedLog.created_at).toLocaleString()}
                      </dd>

                      <dt className="col-5">Usuario</dt>
                      <dd className="col-7">{selectedLog.user_id || "Anónimo"}</dd>

                      <dt className="col-5">Ejemplo</dt>
                      <dd className="col-7">{selectedLog.example_id}</dd>

                      <dt className="col-5">Fuente</dt>
                      <dd className="col-7">{getSourceBadge(selectedLog.response_source)}</dd>

                      <dt className="col-5">Modelo</dt>
                      <dd className="col-7">{selectedLog.ai_model_name || "-"}</dd>
                    </dl>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h6 className="mb-3">
                      <i className="fas fa-chart-bar me-2"></i>Métricas
                    </h6>
                    <dl className="row mb-0 small">
                      <dt className="col-6">Tokens entrada</dt>
                      <dd className="col-6 text-end">
                        {selectedLog.input_tokens?.toLocaleString() || 0}
                      </dd>

                      <dt className="col-6">Tokens salida</dt>
                      <dd className="col-6 text-end">
                        {selectedLog.output_tokens?.toLocaleString() || 0}
                      </dd>

                      <dt className="col-6">Tokens total</dt>
                      <dd className="col-6 text-end fw-bold">
                        {selectedLog.total_tokens?.toLocaleString() || 0}
                      </dd>

                      <dt className="col-6">Latencia</dt>
                      <dd className="col-6 text-end fw-bold">
                        {formatLatency(selectedLog.latency_ms)}
                      </dd>

                      <dt className="col-6">KB Match</dt>
                      <dd className="col-6 text-end">
                        {selectedLog.kb_matched ? (
                          <Badge bg="success">✅ Sí (P:{selectedLog.kb_priority})</Badge>
                        ) : (
                          <Badge bg="secondary">❌ No</Badge>
                        )}
                      </dd>
                    </dl>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={12}>
                <Card className="border-0">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <i className="fas fa-comment me-2"></i>Consulta
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <pre className="mb-0 bg-light p-3 rounded" style={{ whiteSpace: "pre-wrap" }}>
                      {selectedLog.query}
                    </pre>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={12}>
                <Card className="border-0">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <i className="fas fa-reply me-2"></i>Respuesta
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <pre className="mb-0 bg-light p-3 rounded" style={{ whiteSpace: "pre-wrap", maxHeight: "200px", overflowY: "auto" }}>
                      {selectedLog.response_text || <em className="text-muted">Sin respuesta</em>}
                    </pre>
                  </Card.Body>
                </Card>
              </Col>

              {selectedLog.prompt_used && (
                <Col md={12}>
                  <Card className="border-0">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">
                        <i className="fas fa-code me-2"></i>Prompt enviado a IA
                      </h6>
                    </Card.Header>
                    <Card.Body>
                      <pre className="mb-0 bg-light p-3 rounded" style={{ whiteSpace: "pre-wrap", maxHeight: "200px", overflowY: "auto", fontSize: "0.85rem" }}>
                        {selectedLog.prompt_used}
                      </pre>
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
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

export default AgenteKBLogsPage;