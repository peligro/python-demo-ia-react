// src/modules/portfolio_cv/ocr/pages/OCRInvoicePage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { ocrService } from "../services/ocrService";

const STATIC_PDFS = [
  { path: "static/pdfs/factura.pdf", label: "Factura EASY Retail" },
];

// ✅ Interfaz ACTUALIZADA según lo que devuelve el backend
interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  ruc_emitter: string | null;
  emitter_name: string | null;
  emitter_address: string | null;
  ruc_client: string | null;
  client_name: string | null;
  client_address: string | null;
  subtotal: number;
  tax: number;
  total: number;
  items: any[];
}

interface InvoiceResponse {
  file_path: string;
  invoice_data: InvoiceData;
  raw_text: string;
  processing_time_ms: number;
  timestamp: string;
}

const OCRInvoicePage = () => {
  const [pdfPath, setPdfPath] = useState(STATIC_PDFS[0].path);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await ocrService.extractInvoiceFromStaticPDF(pdfPath);
      setResult(response);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Error al procesar");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <Link to="/portfolio-cv/ocr" className="text-decoration-none">
          <small><i className="fas fa-arrow-left me-1"></i>Volver a OCR</small>
        </Link>
        <h2 className="mt-2 mb-1">
          <i className="fas fa-file-invoice-dollar me-2 text-danger"></i>
          Extracción de Facturas PDF
        </h2>
        <p className="text-muted mb-0">Extrae datos estructurados de facturas</p>
      </div>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="mb-3"><i className="fas fa-file-pdf me-2"></i>Seleccionar PDF</h6>

              <Form.Group className="mb-3">
                <Form.Label>Archivo PDF</Form.Label>
                <Form.Select 
                  value={pdfPath} 
                  onChange={(e) => setPdfPath(e.target.value)}
                >
                  {STATIC_PDFS.map((pdf) => (
                    <option key={pdf.path} value={pdf.path}>
                      {pdf.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button
                variant="danger"
                className="w-100"
                onClick={handleProcess}
                disabled={loading}
              >
                {loading ? (
                  <><Spinner size="sm" animation="border" className="me-2" />Procesando...</>
                ) : (
                  <><i className="fas fa-file-invoice me-2"></i>Extraer datos</>
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          {error && <Alert variant="danger">{error}</Alert>}

          {!result && !loading && (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <i className="fas fa-file-pdf fa-3x text-muted mb-3"></i>
                <p className="text-muted mb-0">Selecciona un PDF y presiona "Extraer datos"</p>
              </Card.Body>
            </Card>
          )}

          {result && result.invoice_data && (
            <>
              {/* EMISOR */}
              <Card className="border-0 shadow-sm mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-building me-2 text-primary"></i>
                    Emisor
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-2">
                        <small className="text-muted">RUT:</small>
                        <div className="fw-semibold">{result.invoice_data.ruc_emitter || "N/A"}</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Nombre:</small>
                        <div className="fw-semibold">{result.invoice_data.emitter_name || "N/A"}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-2">
                        <small className="text-muted">Dirección:</small>
                        <div>{result.invoice_data.emitter_address || "N/A"}</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* DOCUMENTO */}
              <Card className="border-0 shadow-sm mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-file-alt me-2 text-info"></i>
                    Documento
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <div className="mb-2">
                        <small className="text-muted">Tipo:</small>
                        <div className="fw-semibold">{result.invoice_data.invoice_number || "N/A"}</div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="mb-2">
                        <small className="text-muted">Folio:</small>
                        <div className="fw-semibold">{result.invoice_data.invoice_number || "N/A"}</div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="mb-2">
                        <small className="text-muted">Fecha:</small>
                        <div>{result.invoice_data.invoice_date || "N/A"}</div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* RECEPTOR */}
              {result.invoice_data.ruc_client && (
                <Card className="border-0 shadow-sm mb-3">
                  <Card.Header className="bg-light">
                    <h6 className="mb-0">
                      <i className="fas fa-user me-2 text-success"></i>
                      Receptor
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <div className="mb-2">
                          <small className="text-muted">RUT:</small>
                          <div className="fw-semibold">{result.invoice_data.ruc_client}</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-2">
                          <small className="text-muted">Nombre:</small>
                          <div className="fw-semibold">{result.invoice_data.client_name || "N/A"}</div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {/* TOTALES */}
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <div className="p-3 bg-light rounded text-center">
                        <small className="text-muted d-block">Neto</small>
                        <h5 className="mb-0 text-primary">
                          {formatCurrency(result.invoice_data.subtotal || 0)}
                        </h5>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 bg-light rounded text-center">
                        <small className="text-muted d-block">IVA ({result.invoice_data.tax}%)</small>
                        <h5 className="mb-0 text-info">
                          {formatCurrency(result.invoice_data.tax || 0)}
                        </h5>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="p-3 bg-danger text-white rounded text-center">
                        <small className="d-block">TOTAL</small>
                        <h4 className="mb-0">
                          {formatCurrency(result.invoice_data.total || 0)}
                        </h4>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* ITEMS */}
              {result.invoice_data.items && result.invoice_data.items.length > 0 && (
                <Card className="border-0 shadow-sm mt-3">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">
                      <i className="fas fa-list me-2"></i>
                      Items
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Descripción</th>
                          <th className="text-end">Cantidad</th>
                          <th className="text-end">P. Unit</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.invoice_data.items.map((item, idx) => (
                          <tr key={idx}>
                            <td><code>{item.codigo || "-"}</code></td>
                            <td>{item.descripcion}</td>
                            <td className="text-end">{item.cantidad}</td>
                            <td className="text-end">{formatCurrency(item.precio_unitario)}</td>
                            <td className="text-end">{formatCurrency(item.monto_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card.Body>
                </Card>
              )}

              {/* TEXTO EXTRAÍDO */}
              <Card className="border-0 shadow-sm mt-3">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">
                    <i className="fas fa-code me-2"></i>
                    Texto extraído
                  </h6>
                </Card.Header>
                <Card.Body>
                  <pre
                    className="mb-0 p-3 bg-light rounded"
                    style={{ 
                      whiteSpace: "pre-wrap", 
                      fontSize: "0.85rem", 
                      maxHeight: "300px", 
                      overflowY: "auto" 
                    }}
                  >
                    {result.raw_text || "(Vacío)"}
                  </pre>
                </Card.Body>
              </Card>

              <Alert variant="info" className="mt-3 mb-0">
                <i className="fas fa-clock me-2"></i>
                Tiempo de procesamiento: <strong>{result.processing_time_ms}ms</strong>
              </Alert>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default OCRInvoicePage;