// src/modules/portfolio/agent_rag_pdf_multi_agent/pages/AgentRagPdfPage.tsx
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
  Nav,
  Tab,
  Table,
  Alert,
} from "react-bootstrap";
import { agentRagPdfService } from "../services/agentRagPdfService";
import type {
  RAGJob,
  ChatMessage,
  SessionMetrics,
  QueueProvider,
  JobStatus,
  RAGQueryResponse,
} from "../interfaces/agentRagPdfInterfaces";

const AgentRagPdfPage = () => {
  // --- ESTADO GLOBAL ---
  const [activeTab, setActiveTab] = useState<
    "upload" | "jobs" | "history" | "chat"
  >("upload");
  const [queueProviders, setQueueProviders] = useState<QueueProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("redis");

  // --- ESTADO TAB 1: SUBIR PDF ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- ESTADO TAB 2: JOBS ACTIVOS ---
  const [activeJobs, setActiveJobs] = useState<RAGJob[]>([]);
  const [polling, setPolling] = useState(false);

  // --- ESTADO TAB 3: HISTORIAL / AUDITORÍA ---
  const [historyJobs, setHistoryJobs] = useState<RAGJob[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("completed");
  const [historyTotal, setHistoryTotal] = useState(0);

  // --- ESTADO TAB 4: CHAT RAG ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("mistral-small-latest");
  const [kbThreshold, setKbThreshold] = useState(0.75);
  const [chatMetrics, setChatMetrics] = useState<SessionMetrics>({
    totalQueries: 0,
    totalChunksRetrieved: 0,
    avgLatency: 0,
    lastQueryTime: null,
    kbQueries: 0,
    aiQueries: 0,
    totalTokens: 0,
  });

  // --- ESTADO UI: TOAST & MODAL ---
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<
    "success" | "danger" | "info"
  >("success");
  const [showAboutModal, setShowAboutModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Token quota (simulado - estimado en base a chunks)
  const tokenQuota = {
    used: chatMetrics.totalTokens,
    limit: 100000,
    resetAt: "00:00",
  };
  const tokenUsagePercent = (tokenQuota.used / tokenQuota.limit) * 100;

  // ========================================================================
  // EFECTOS
  // ========================================================================

  useEffect(() => {
    loadQueueProviders();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Polling para Jobs Activos
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const hasPendingJobs = activeJobs.some(
      (j) => j.status === "queued" || j.status === "processing",
    );

    if (hasPendingJobs) {
      setPolling(true);
      interval = setInterval(() => {
        refreshActiveJobs();
      }, 3000);
    } else {
      setPolling(false);
    }

    return () => clearInterval(interval);
  }, [activeJobs]);

  // Cargar historial al cambiar a la pestaña
  useEffect(() => {
    if (activeTab === "history") {
      loadHistoryJobs();
    }
  }, [activeTab]);

  // ========================================================================
  // FUNCIONES DE SERVICIO
  // ========================================================================

  const loadQueueProviders = async () => {
    try {
      const res = await agentRagPdfService.getQueueProviders();
      setQueueProviders(res.providers);
      if (res.providers.length > 0) {
        const available = res.providers.find((p) => p.status === "available");
        if (available) {
          setSelectedProvider(available.name);
        } else {
          setSelectedProvider(res.providers[0].name);
        }
      }
    } catch (err) {
      console.error("Error cargando proveedores de cola:", err);
      setQueueProviders([
        { name: "redis", status: "available" as const },
        { name: "sqs", status: "available" as const },
      ]);
      setSelectedProvider("redis");
    }
  };

  const refreshActiveJobs = async () => {
    try {
      const updatedJobs = await Promise.all(
        activeJobs.map(async (job) => {
          try {
            const updatedJob = await agentRagPdfService.getJobStatus(
              job.job_id,
            );
            return updatedJob;
          } catch (err) {
            console.error(`Error actualizando job ${job.job_id}:`, err);
            return job;
          }
        }),
      );
      setActiveJobs(updatedJobs);
    } catch (err) {
      console.error("Error refrescando jobs:", err);
    }
  };

  const loadHistoryJobs = async () => {
    setLoadingHistory(true);
    try {
      const params: any = {
        limit: 50,
        offset: 0,
      };

      if (historyStatus) params.status = historyStatus;
      if (historySearch.trim()) params.search = historySearch.trim();

      const res = await agentRagPdfService.listJobs(params);
      setHistoryJobs(res.jobs);
      setHistoryTotal(res.total);
    } catch (err) {
      console.error("Error cargando historial:", err);
      setToastMessage("❌ Error al cargar el historial");
      setToastVariant("danger");
      setShowToast(true);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setToastMessage("⚠️ Por favor selecciona un archivo PDF");
      setToastVariant("danger");
      setShowToast(true);
      return;
    }

    setUploading(true);
    try {
      const res = await agentRagPdfService.uploadPdf(
        selectedFile,
        selectedProvider,
      );
      setToastMessage(
        `✅ Job ${res.job_id} encolado exitosamente en ${res.queue_provider}`,
      );
      setToastVariant("success");
      setShowToast(true);

      const newJob: RAGJob = {
        job_id: res.job_id,
        status: res.status,
        filename: selectedFile.name,
        file_size: selectedFile.size,
        chunks_created: null,
        processing_time_ms: null,
        error_message: null,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      setActiveJobs((prev) => [newJob, ...prev]);

      setSelectedFile(null);
      setActiveTab("jobs");
    } catch (err: any) {
      console.error("Error subiendo PDF", err);
      setToastMessage(err.response?.data?.detail || "Error al subir el PDF");
      setToastVariant("danger");
      setShowToast(true);
    } finally {
      setUploading(false);
    }
  };

  const getPdfViewUrl = (jobId: number): string => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8050";
    return `${baseUrl}/rag-pdf/jobs/${jobId}/download`;
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      text: chatInput.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const currentQuery = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    try {
      const res: RAGQueryResponse = await agentRagPdfService.queryRag(
        currentQuery,
        selectedModel,
        kbThreshold,
        3
      );

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: res.response,
        sender: "bot",
        timestamp: new Date(),
        metrics: {
          latency_ms: res.latency_ms,
          chunks_used: res.chunks_used,
          model_used: res.model_used,
          cache: res.cache,
          source: res.source,
          similarity_score: res.similarity_score,
        },
      };

      setChatMessages((prev) => [...prev, botMsg]);

      // Actualizar métricas
      setChatMetrics((prev) => {
        const newTotal = prev.totalQueries + 1;
        const newLatency = res.latency_ms;
        const estimatedTokens = res.chunks_used * 150; // ~150 tokens por chunk (estimado)

        return {
          totalQueries: newTotal,
          totalChunksRetrieved: prev.totalChunksRetrieved + res.chunks_used,
          avgLatency: Math.round(
            (prev.avgLatency * prev.totalQueries + newLatency) / newTotal,
          ),
          lastQueryTime: new Date(),
          kbQueries: prev.kbQueries + (res.source === "knowledge-base" ? 1 : 0),
          aiQueries: prev.aiQueries + (res.source === "rag-ai" ? 1 : 0),
          totalTokens: prev.totalTokens + estimatedTokens,
        };
      });
    } catch (err: any) {
      console.error("Error en consulta RAG", err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        text: "⚠️ Error al procesar la consulta. Verifica que haya jobs completados.",
        sender: "bot",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e as any);
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    setChatInput("");
    setChatMetrics({
      totalQueries: 0,
      totalChunksRetrieved: 0,
      avgLatency: 0,
      lastQueryTime: null,
      kbQueries: 0,
      aiQueries: 0,
      totalTokens: 0,
    });
    setToastMessage("🗑️ Conversación reiniciada");
    setToastVariant("success");
    setShowToast(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage("📋 Copiado al portapapeles");
    setToastVariant("success");
    setShowToast(true);
  };

  // ========================================================================
  // HELPERS UI
  // ========================================================================

  const getStatusBadge = (status: JobStatus) => {
    const config = {
      queued: { bg: "warning", text: "text-dark", icon: "⏳", label: "En Cola" },
      processing: { bg: "info", text: "text-white", icon: "⚙️", label: "Procesando" },
      completed: { bg: "success", text: "text-white", icon: "✅", label: "Completado" },
      failed: { bg: "danger", text: "text-white", icon: "❌", label: "Fallido" },
    };
    const c = config[status];
    return (
      <Badge bg={c.bg} className={c.text}>
        {c.icon} {c.label}
      </Badge>
    );
  };

  const getSourceBadge = (source: string | undefined) => {
    if (!source) return null;
    const config: Record<string, { bg: string; text: string; icon: string; label: string }> = {
      "knowledge-base": { bg: "success", text: "text-white", icon: "📚", label: "KB Direct" },
      "rag-ai": { bg: "primary", text: "text-white", icon: "🤖", label: "IA + RAG" },
      "none": { bg: "secondary", text: "text-white", icon: "❓", label: "Sin contexto" },
    };
    const c = config[source] || config["none"];
    return (
      <Badge bg={c.bg} className={c.text}>
        {c.icon} {c.label}
      </Badge>
    );
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatSimilarity = (score: number | undefined) => {
    if (score === undefined || score === null) return "N/A";
    const percentage = (score * 100).toFixed(1);
    return `${percentage}%`;
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <Container fluid className="py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="fas fa-file-pdf me-2 text-danger"></i>
            Agente RAG PDF Multi Agent
          </h2>
          <p className="text-muted mb-0">
            Sube manuales en PDF, procesa pares P/R automáticamente y consulta
            la base de conocimiento con IA.
          </p>
        </div>
        <Button
          variant="outline-secondary"
          onClick={() => setShowAboutModal(true)}
        >
          <i className="fas fa-info-circle me-2"></i>Acerca de
        </Button>
      </div>

      {/* TABS */}
      <Tab.Container
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k as any)}
      >
        <Nav variant="pills" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="upload">
              <i className="fas fa-cloud-upload-alt me-2"></i>Subir PDF
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="jobs">
              <i className="fas fa-tasks me-2"></i>Jobs Activos
              {polling && (
                <Spinner animation="border" size="sm" className="ms-2" />
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="history">
              <i className="fas fa-history me-2"></i>Historial / Auditoría
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="chat">
              <i className="fas fa-comments me-2"></i>Chat RAG
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* ================= TAB 1: SUBIR PDF ================= */}
          <Tab.Pane eventKey="upload">
            <Row className="justify-content-center">
              <Col lg={8}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <h5 className="mb-3">1. Selecciona el Proveedor de Cola</h5>
                    <Form.Select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="mb-4"
                    >
                      {queueProviders.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name.toUpperCase()}{" "}
                          {p.status !== "available"
                            ? `(Status: ${p.status})`
                            : "(Disponible)"}
                        </option>
                      ))}
                    </Form.Select>

                    <h5 className="mb-3">2. Arrastra o selecciona tu PDF</h5>
                    <div
                      className={`border rounded-3 p-5 text-center mb-4 transition-all ${
                        isDragging
                          ? "bg-primary bg-opacity-10 border-primary"
                          : "bg-light border-dashed"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          setSelectedFile(e.dataTransfer.files[0]);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <i
                        className={`fas fa-file-pdf fa-4x mb-3 ${
                          isDragging ? "text-primary" : "text-muted opacity-50"
                        }`}
                      ></i>
                      {selectedFile ? (
                        <div>
                          <h6 className="text-primary mb-1">
                            {selectedFile.name}
                          </h6>
                          <small className="text-muted">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </small>
                          <Button
                            variant="link"
                            size="sm"
                            className="d-block mx-auto mt-2 text-danger"
                            onClick={() => setSelectedFile(null)}
                          >
                            <i className="fas fa-times me-1"></i>Quitar archivo
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-2">Arrastra tu archivo PDF aquí o</p>
                          <Form.Control
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="d-inline-block w-auto mx-auto"
                            style={{ maxWidth: "300px" }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="d-grid">
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                      >
                        {uploading ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                            Subiendo y encolando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-rocket me-2"></i>Iniciar
                            Procesamiento
                          </>
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          {/* ================= TAB 2: JOBS ACTIVOS ================= */}
          <Tab.Pane eventKey="jobs">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="fas fa-tasks me-2 text-primary"></i>Estado de
                  Procesamiento
                </h6>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={refreshActiveJobs}
                >
                  <i className="fas fa-sync-alt me-1"></i>Actualizar
                </Button>
              </Card.Header>
              <Card.Body>
                {activeJobs.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <i className="fas fa-inbox fa-2x mb-2 d-block opacity-50"></i>
                    No hay jobs activos en este momento.
                  </Alert>
                ) : (
                  <Table responsive hover>
                    <thead className="table-light">
                      <tr>
                        <th>ID Job</th>
                        <th>Archivo</th>
                        <th>Estado</th>
                        <th>Chunks</th>
                        <th>Tiempo</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeJobs.map((job) => (
                        <tr key={job.job_id}>
                          <td>
                            <Badge bg="secondary">#{job.job_id}</Badge>
                          </td>
                          <td
                            className="text-truncate"
                            style={{ maxWidth: "200px" }}
                            title={job.filename}
                          >
                            <i className="fas fa-file-pdf text-danger me-2"></i>
                            {job.filename}
                          </td>
                          <td>{getStatusBadge(job.status)}</td>
                          <td>
                            {job.status === "processing" ? (
                              <Spinner
                                animation="border"
                                size="sm"
                                variant="info"
                              />
                            ) : (
                              job.chunks_created ?? "0"
                            )}
                          </td>
                          <td>{formatTime(job.processing_time_ms)}</td>
                          <td>
                            <small className="text-muted">
                              {formatDate(job.created_at)}
                            </small>
                            {job.error_message && (
                              <div className="text-danger small mt-1">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                {job.error_message}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* ================= TAB 3: HISTORIAL / AUDITORÍA ================= */}
          <Tab.Pane eventKey="history">
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={4}>
                    <Form.Label className="small text-muted">
                      Buscar por nombre de archivo
                    </Form.Label>
                    <Form.Control
                      placeholder="Ej: manual.pdf"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Label className="small text-muted">Estado</Form.Label>
                    <Form.Select
                      value={historyStatus}
                      onChange={(e) => setHistoryStatus(e.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="completed">✅ Completados</option>
                      <option value="failed">❌ Fallidos</option>
                      <option value="processing">⚙️ Procesando</option>
                      <option value="queued">⏳ En Cola</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={loadHistoryJobs}
                      disabled={loadingHistory}
                    >
                      {loadingHistory ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <i className="fas fa-search me-1"></i>
                      )}{" "}
                      Buscar
                    </Button>
                  </Col>
                  <Col md={3} className="text-end">
                    <small className="text-muted">
                      <i className="fas fa-database me-1"></i>
                      Total: <strong>{historyTotal}</strong> archivos
                    </small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                {loadingHistory ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-2">Cargando historial...</p>
                  </div>
                ) : historyJobs.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="fas fa-folder-open fa-3x mb-3 opacity-25"></i>
                    <h6 className="mb-2">No hay archivos procesados</h6>
                    <p className="mb-0">
                      Los PDFs que subas y proceses exitosamente aparecerán aquí
                      en la carpeta <code>archive/</code> del bucket S3.
                    </p>
                  </div>
                ) : (
                  <Table responsive hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "7%" }}>ID</th>
                        <th style={{ width: "30%" }}>Archivo</th>
                        <th style={{ width: "12%" }}>Estado</th>
                        <th style={{ width: "9%" }}>Tamaño</th>
                        <th style={{ width: "8%" }}>Chunks</th>
                        <th style={{ width: "9%" }}>Tiempo</th>
                        <th style={{ width: "15%" }}>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyJobs.map((job) => (
                        <tr key={job.job_id}>
                          <td>
                            <Badge bg="secondary">#{job.job_id}</Badge>
                          </td>
                          <td>
                            <a
                              href={getPdfViewUrl(job.job_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none d-flex align-items-center"
                              title="Click para ver el PDF en nueva pestaña"
                            >
                              <i className="fas fa-file-pdf text-danger me-2"></i>
                              <span
                                className="text-truncate"
                                style={{ maxWidth: "200px" }}
                                title={job.filename}
                              >
                                {job.filename}
                              </span>
                              <i className="fas fa-external-link-alt ms-2 small text-muted"></i>
                            </a>
                          </td>
                          <td>{getStatusBadge(job.status)}</td>
                          <td>
                            <small>{formatFileSize(job.file_size)}</small>
                          </td>
                          <td>
                            <Badge bg="info" className="text-white">
                              {job.chunks_created ?? 0}
                            </Badge>
                          </td>
                          <td>
                            <small>{formatTime(job.processing_time_ms)}</small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(job.created_at)}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>

          {/* ================= TAB 4: CHAT RAG ================= */}
          <Tab.Pane eventKey="chat">
            <Row className="g-4">
              <Col lg={8} xl={9}>
                <Card
                  className="border-0 shadow-sm mb-3"
                  style={{ minHeight: "500px", maxHeight: "65vh" }}
                >
                  <Card.Body className="p-0">
                    <div
                      className="p-3"
                      style={{
                        overflowY: "auto",
                        maxHeight: "calc(65vh - 120px)",
                      }}
                    >
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted py-5">
                          <i className="fas fa-robot fa-4x mb-3 opacity-25"></i>
                          <h5 className="mb-2">¡Chat RAG listo!</h5>
                          <p>
                            Haz una pregunta sobre los documentos PDF
                            procesados.
                          </p>
                          <small className="d-block mb-2">
                            Ej: <em>"¿Cuál es la política de garantías?"</em>
                          </small>
                          <small className="d-block">
                            El flujo: primero busca en KB (costo $0) → si no
                            encuentra match &gt; {Math.round(kbThreshold * 100)}%, usa IA
                            con contexto.
                          </small>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
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
                                  : "bg-light border"
                              }`}
                              style={{ maxWidth: "85%" }}
                            >
                              <p
                                className="mb-1"
                                style={{
                                  whiteSpace: "pre-line",
                                  lineHeight: 1.6,
                                }}
                              >
                                {msg.text}
                              </p>
                              {msg.sender === "bot" && msg.metrics && (
                                <div className="d-flex align-items-center mt-2 flex-wrap gap-2">
                                  <small className="text-muted">
                                    <i className="far fa-clock me-1"></i>
                                    {msg.timestamp.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </small>
                                  {getSourceBadge(msg.metrics.source)}
                                  {msg.metrics.cache && (
                                    <Badge bg="warning" text="dark">
                                      <i className="fas fa-bolt me-1"></i>Cache
                                    </Badge>
                                  )}
                                  <small className="text-muted">
                                    <i className="fas fa-layer-group me-1"></i>
                                    {msg.metrics.chunks_used} chunks
                                  </small>
                                  <small className="text-muted">
                                    <i className="fas fa-stopwatch me-1"></i>
                                    {msg.metrics.latency_ms}ms
                                  </small>
                                  {msg.metrics.similarity_score !== undefined && (
                                    <small className="text-muted">
                                      <i className="fas fa-bullseye me-1"></i>
                                      Sim: {formatSimilarity(msg.metrics.similarity_score)}
                                    </small>
                                  )}
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 ms-1 text-muted"
                                    onClick={() => handleCopy(msg.text)}
                                    title="Copiar respuesta"
                                  >
                                    <small>
                                      <i className="fas fa-copy me-1"></i>Copiar
                                    </small>
                                  </Button>
                                </div>
                              )}
                              {msg.sender === "bot" && msg.metrics?.model_used && msg.metrics.model_used !== "kb-direct" && (
                                <small className="text-muted d-block mt-1">
                                  <i className="fas fa-microchip me-1"></i>
                                  Modelo: {msg.metrics.model_used}
                                </small>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      {chatLoading && (
                        <div className="d-flex justify-content-start mb-3">
                          <div className="p-3 rounded-3 bg-light border">
                            <Spinner
                              animation="border"
                              size="sm"
                              variant="primary"
                              className="me-2"
                            />
                            <small className="text-muted">
                              Buscando en KB + IA...
                            </small>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </Card.Body>
                </Card>

                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-3">
                    {/* Selector de Modelo */}
                    <Row className="mb-2 g-2">
                      <Col md={6}>
                        <Form.Label className="small text-muted mb-1">
                          <i className="fas fa-microchip me-1"></i>Modelo de IA (fallback)
                        </Form.Label>
                        <Form.Select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          size="sm"
                        >
                          <option value="mistral-small-latest">Mistral Small (Capa gratuita)</option>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash (Capa gratuita)</option>
                          <option value="claude-opus-4-8">Claude 4 Opus (premium)</option>
                          <option value="gpt-4o-mini">GPT-4o Mini (premium)</option>
                          <option value="deepseek-chat">DeepSeek Chat (Capa gratuita)</option>
                        </Form.Select>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="small text-muted mb-1">
                          <i className="fas fa-bullseye me-1"></i>
                          Threshold KB: {Math.round(kbThreshold * 100)}%
                        </Form.Label>
                        <Form.Range
                          min={0.3}
                          max={0.95}
                          step={0.05}
                          value={kbThreshold}
                          onChange={(e) => setKbThreshold(parseFloat(e.target.value))}
                          className="mt-2"
                        />
                      </Col>
                    </Row>

                    <Form onSubmit={handleChatSubmit}>
                      <Row className="g-2">
                        <Col>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Escribe tu consulta sobre los PDFs..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={chatLoading}
                            style={{ resize: "none" }}
                          />
                        </Col>
                        <Col xs="auto">
                          <Button
                            variant="primary"
                            onClick={handleChatSubmit}
                            disabled={!chatInput.trim() || chatLoading}
                            className="h-100"
                          >
                            {chatLoading ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <i className="fas fa-paper-plane"></i>
                            )}
                          </Button>
                        </Col>
                      </Row>
                      <div className="d-flex justify-content-between mt-2">
                        <small className="text-muted">
                          <kbd>Enter</kbd> para enviar • <kbd>Shift+Enter</kbd>{" "}
                          para nueva línea
                        </small>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={clearChat}
                          disabled={chatMessages.length === 0}
                        >
                          <i className="fas fa-trash-alt me-1"></i>Limpiar
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              {/* ================= SIDEBAR MEJORADO ================= */}
              <Col lg={4} xl={3}>
                {/* Métricas de Sesión */}
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-primary text-white">
                    <h6 className="mb-0">
                      <i className="fas fa-chart-line me-2"></i>Métricas de
                      Sesión
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    {/* Consultas */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small className="text-muted">Consultas</small>
                        <Badge bg="primary">{chatMetrics.totalQueries}</Badge>
                      </div>
                    </div>

                    {/* Tokens estimados */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small className="text-muted">Tokens estimados</small>
                        <small className="fw-bold">
                          {chatMetrics.totalTokens.toLocaleString()}
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
                          {chatMetrics.avgLatency}ms
                        </small>
                      </div>
                      <ProgressBar
                        now={
                          chatMetrics.avgLatency > 2000
                            ? 100
                            : (chatMetrics.avgLatency / 2000) * 100
                        }
                        variant={
                          chatMetrics.avgLatency > 2000
                            ? "danger"
                            : chatMetrics.avgLatency > 1000
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
                            {chatMetrics.kbQueries}
                          </div>
                          <small className="text-muted">📚 KB</small>
                        </div>
                        <div className="flex-grow-1 text-center p-2 rounded bg-primary bg-opacity-10">
                          <div className="fw-bold text-primary">
                            {chatMetrics.aiQueries}
                          </div>
                          <small className="text-muted">🤖 IA</small>
                        </div>
                      </div>
                      {chatMetrics.totalQueries > 0 && (
                        <small className="text-muted d-block mt-2 text-center">
                          <strong>
                            {Math.round(
                              (chatMetrics.kbQueries / chatMetrics.totalQueries) * 100,
                            )}%
                          </strong>{" "}
                          respuestas desde KB (costo $0)
                        </small>
                      )}
                    </div>

                    {/* Chunks recuperados */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small className="text-muted">Chunks recuperados</small>
                        <small className="fw-bold">
                          {chatMetrics.totalChunksRetrieved}
                        </small>
                      </div>
                    </div>

                    {/* Modelo activo */}
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">Modelo activo</small>
                      <Badge bg="secondary" className="w-100 text-start p-2">
                        <i className="fas fa-microchip me-2"></i>
                        {selectedModel}
                      </Badge>
                    </div>

                    {/* Threshold KB */}
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1">Threshold KB</small>
                      <Badge bg="info" className="w-100 text-start p-2">
                        <i className="fas fa-bullseye me-2"></i>
                        {Math.round(kbThreshold * 100)}% similitud mínima
                      </Badge>
                    </div>

                    {/* Última consulta */}
                    {chatMetrics.lastQueryTime && (
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">
                          Última consulta
                        </small>
                        <small className="d-block">
                          {chatMetrics.lastQueryTime.toLocaleTimeString()}
                        </small>
                      </div>
                    )}

                    {/* Botón limpiar */}
                    {chatMessages.length > 0 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={clearChat}
                        className="w-100"
                      >
                        <i className="fas fa-trash-alt me-2"></i>
                        Limpiar conversación
                      </Button>
                    )}
                  </Card.Body>
                </Card>

                {/* Tips rápidos */}
                <Card className="border-0 shadow-sm mb-3">
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
                        <strong>KB Direct</strong> (📚): match directo, costo $0
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check text-success me-2"></i>
                        <strong>IA + RAG</strong> (🤖): usa IA con contexto de chunks
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-sliders-h text-info me-2"></i>
                        Sube el <strong>threshold</strong> para forzar más KB directo
                      </li>
                      <li className="pt-2 border-top">
                        <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                        Si no hay jobs "completed", el chat no tendrá contexto
                      </li>
                    </ul>
                  </Card.Body>
                </Card>

                {/* Enlaces rápidos */}
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-2">
                    <div className="d-grid gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setActiveTab("jobs")}
                      >
                        <i className="fas fa-tasks me-2"></i>Ver estado de jobs
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setActiveTab("history")}
                      >
                        <i className="fas fa-history me-2"></i>Ver historial PDFs
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* ================= MODAL ACERCA DE (MEJORADO) ================= */}
      <Modal
        show={showAboutModal}
        onHide={() => setShowAboutModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-info-circle me-2"></i>Agente RAG PDF Multi
            Agent
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Row>
            <Col md={7}>
              <h5 className="mb-3">¿Qué es este módulo?</h5>
              <p className="text-muted">
                El <strong>Agente RAG PDF Multi Agent</strong> es un sistema
                inteligente que combina procesamiento asíncrono de PDFs con
                búsqueda vectorial (RAG) y múltiples modelos de IA para
                proporcionar respuestas precisas basadas en tus documentos.
              </p>

              <h6 className="mt-4 mb-3">Flujo de consulta:</h6>
              <ol className="list-unstyled">
                <li className="mb-2">
                  <i className="fas fa-1 text-primary me-2"></i>
                  <strong>Cache Redis:</strong> Si la consulta ya fue
                  respondida, retorna del cache (costo $0).
                </li>
                <li className="mb-2">
                  <i className="fas fa-2 text-primary me-2"></i>
                  <strong>Búsqueda vectorial:</strong> Busca en los chunks de
                  la BD usando similitud coseno (pgvector).
                </li>
                <li className="mb-2">
                  <i className="fas fa-3 text-primary me-2"></i>
                  <strong>Match directo:</strong> Si similitud &gt; threshold →
                  respuesta directa de KB (costo $0).
                </li>
                <li className="mb-2">
                  <i className="fas fa-4 text-primary me-2"></i>
                  <strong>Fallback IA:</strong> Si no hay match → llama a IA
                  con contexto de los chunks encontrados.
                </li>
              </ol>

              <Alert variant="info" className="mt-3">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Optimización de costos:</strong> El sistema prioriza
                respuestas de KB (gratis) sobre IA (con costo). Ajusta el
                threshold para balancear precisión vs costo.
              </Alert>
            </Col>

            <Col md={5}>
              <h6 className="mb-3">Tecnologías</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Badge bg="primary" className="p-2">Python 3.12</Badge>
                <Badge bg="primary" className="p-2">FastAPI</Badge>
                <Badge bg="primary" className="p-2">SQLModel</Badge>
                <Badge bg="primary" className="p-2">Alembic</Badge>
                <Badge bg="primary" className="p-2">PostgreSQL</Badge>
                <Badge bg="primary" className="p-2">pgvector</Badge>
                <Badge bg="info" className="p-2">React 19 + TS</Badge>
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
                  <i className="fas fa-database me-1"></i>LocalStack (S3)
                </Badge>
                <Badge bg="secondary" className="p-2">
                  <i className="fas fa-bolt me-1"></i>Redis Streams
                </Badge>
                <Badge bg="secondary" className="p-2">
                  <i className="fab fa-aws me-1"></i>AWS SQS
                </Badge>
              </div>

              <h6 className="mb-2">Repositorios</h6>
              <div className="d-grid gap-2 mb-3">
                <a
                  href="https://github.com/peligro/python-demo-ia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark btn-sm text-start"
                  title="Backend (Python/FastAPI)"
                >
                  <i className="fab fa-github me-2"></i>
                  Backend (Python/FastAPI)
                </a>
                <a
                  href="https://github.com/peligro/python-worket-demo-ia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark btn-sm text-start"
                  title="Worker (Python)"
                >
                  <i className="fab fa-github me-2"></i>
                  Worker (Python)
                </a>
                <a
                  href="https://github.com/peligro/python-demo-ia-react"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark btn-sm text-start"
                  title="Frontend (React Vite + TypeScript+ Bootstrap)"
                >
                  <i className="fab fa-github me-2"></i>
                  Frontend (React Vite + TypeScript+ Bootstrap)
                </a>
              </div>

              <h6 className="mb-2">Archivos del módulo</h6>
              <div className="small">
                <div className="mb-2">
                  <strong className="d-block text-primary mb-1">
                    🐍 Backend (FastAPI)
                  </strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li><code>models/rag_job.py</code>, <code>models/rag_chunk.py</code></li>
                    <li><code>schemas/rag_pdf.py</code></li>
                    <li><code>services/rag_pdf/rag_pdf_service.py</code></li>
                    <li><code>services/rag_pdf/rag_cache_service.py</code></li>
                    <li><code>services/rag_pdf/s3_service.py</code></li>
                    <li><code>router/rag_pdf/rag_pdf_router.py</code></li>
                    <li><code>worker/services/rag/pdf_processor.py</code></li>
                  </ul>
                </div>
                <div>
                  <strong className="d-block text-info mb-1">
                    ⚛️ Frontend (React)
                  </strong>
                  <ul className="list-unstyled mb-0 ps-3">
                    <li><code>src/router.tsx</code></li>
                    <li><code>agent_rag_pdf_multi_agent/pages/AgentRagPdfPage.tsx</code></li>
                    <li><code>agent_rag_pdf_multi_agent/services/agentRagPdfService.ts</code></li>
                    <li><code>agent_rag_pdf_multi_agent/interfaces/agentRagPdfInterfaces.ts</code></li>
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
                      FastAPI + Worker + Colas
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
                    <div className="small fw-bold">IA Multi-modelo</div>
                    <small className="text-muted">5 proveedores</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <i className="fas fa-cloud fa-2x text-info mb-2"></i>
                    <div className="small fw-bold">Storage</div>
                    <small className="text-muted">S3 / LocalStack</small>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>

          <hr className="my-4" />

          <Row>
            <Col>
              <h6 className="mb-3">Métricas en vivo</h6>
              <Row className="g-3">
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h3 mb-0 text-primary">
                      {chatMetrics.totalQueries}
                    </div>
                    <small className="text-muted">Consultas hoy</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h3 mb-0 text-success">
                      {chatMetrics.totalQueries > 0
                        ? Math.round(
                            (chatMetrics.kbQueries / chatMetrics.totalQueries) * 100,
                          )
                        : 0}%
                    </div>
                    <small className="text-muted">Respuestas desde KB</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h3 mb-0 text-info">
                      {chatMetrics.avgLatency}ms
                    </div>
                    <small className="text-muted">Latencia promedio</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center p-3 bg-light rounded">
                    <div className="h3 mb-0 text-warning">
                      {chatMetrics.totalChunksRetrieved}
                    </div>
                    <small className="text-muted">Chunks usados</small>
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

      {/* ================= TOAST ================= */}
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

export default AgentRagPdfPage;