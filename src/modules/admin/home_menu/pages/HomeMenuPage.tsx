import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Modal,
  Form,
  Button,
  Table,
  Card,
  InputGroup,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import { homeMenuService } from "../services/homeMenuService";
import { moduleService } from "../../modules/services/moduleService";
import type {
  HomeMenuItem,
  HomeMenuFormData,
  HomeMenuFormErrors,
} from "../interfaces/HomeMenuInterface";
import type { AlertCustomInterface } from "../../../../common/interfaces/AlertCustomInterface";
import AlertCustom from "../../../../common/ui/AlertCustom";
import PaginacionCustom from "../../../../common/ui/PaginacionCustom";
import type { ModuleOption } from "../../profiles/interfaces/ProfileInterface";

const HomeMenuPage: React.FC = () => {

  // Estado de datos
  const [homeMenus, setHomeMenus] = useState<HomeMenuItem[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1,
  });
  const [loading, setLoading] = useState(false);

  // Estado del modal
  const [show, setShow] = useState(false);
  const [accion, setAccion] = useState<1 | 2>(1);
  const [accionId, setAccionId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState<HomeMenuFormData>({
    title: "",
    icon: "",
    color: "#3B82F6", // Default azul
    description: "",
    slug: "",
    order: 1,
    module_id: null,
  });

  const [errors, setErrors] = useState<HomeMenuFormErrors>({});
  const [backendError, setBackendError] = useState<string>("");

  // Estado de alertas
  const [alertData, setAlertData] = useState<AlertCustomInterface>({
    estado: false,
    titulo: "",
    detalle: "",
    headerBg: "",
    esConfirm: false,
    confirmText: "",
    cancelText: "",
    onClose: () => {},
    onConfirm: () => {},
  });

  // Validación de campos
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case "title":
        if (!value?.trim()) return "El título es obligatorio";
        if (value.length < 2) return "Mínimo 2 caracteres";
        if (value.length > 200) return "Máximo 200 caracteres";
        return "";
      case "icon":
        if (!value?.trim()) return "El ícono es obligatorio";
        if (value.length < 2) return "Mínimo 2 caracteres";
        if (value.length > 100) return "Máximo 100 caracteres";
        return "";
      case "color":
        if (!value?.trim()) return "El color es obligatorio";
        if (!/^#?([0-9a-fA-F]{3}){1,2}$/.test(value)) return "Formato HEX inválido";
        return "";
      case "description":
        if (!value?.trim()) return "La descripción es obligatoria";
        if (value.length < 10) return "Mínimo 10 caracteres";
        if (value.length > 500) return "Máximo 500 caracteres";
        return "";
      case "slug":
        if (!value?.trim()) return "El slug es obligatorio";
        if (!/^[a-z0-9\-_]+$/.test(value)) return "Solo letras minúsculas, números y guiones";
        if (value.length < 2) return "Mínimo 2 caracteres";
        if (value.length > 200) return "Máximo 200 caracteres";
        return "";
      case "order":
        if (value === undefined || value === null || value < 0) return "Debe ser ≥ 0";
        return "";
      default:
        return "";
    }
  };

  // Manejo de cambios en formulario
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    // Convertir slug a minúsculas
    const fieldValue = name === "slug" ? value.toLowerCase() : value;
    
    setFormData((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : fieldValue }));

    const error = validateField(name, fieldValue);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) newErrors[name as keyof HomeMenuFormErrors] = error;
      else delete newErrors[name as keyof HomeMenuFormErrors];
      return newErrors;
    });
    if (backendError) setBackendError("");
  };

  // Mostrar alerta
  const showAlert = (
    titulo: string,
    detalle: string,
    headerBg: string,
    esConfirm: boolean = false,
    onConfirm?: () => void,
    onCloseOverride?: () => void
  ) => {
    setAlertData({
      estado: true,
      titulo,
      detalle,
      headerBg,
      esConfirm,
      confirmText: esConfirm ? "Confirmar" : "",
      cancelText: esConfirm ? "Cancelar" : "",
      onClose: onCloseOverride || (() => setAlertData((prev) => ({ ...prev, estado: false }))),
      onConfirm,
    });
  };

  // Cargar datos
  const loadHomeMenus = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await homeMenuService.index(page, pagination.per_page);
      setHomeMenus(response.data ?? []);
      setPagination({
        current_page: response.page,
        per_page: response.limit,
        total: response.total,
        last_page: Math.ceil(response.total / response.limit),
      });
    } catch (error: any) {
      console.error("Error cargando Home Menus:", error);
      showAlert(
        "Error",
        error.response?.data?.message || "No se pudieron cargar los datos",
        "bg-danger"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      const data = await moduleService.index(1, 100);
      setModules(data.data ?? []);
    } catch (error) {
      console.error("Error cargando módulos:", error);
    }
  };

  useEffect(() => {
    loadHomeMenus();
    loadModules();
  }, []);

  // Manejo del modal
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setValidated(false);
    setErrors({});
    setBackendError("");
    setFormData({
      title: "",
      icon: "",
      color: "#3B82F6",
      description: "",
      slug: "",
      order: 1,
      module_id: null,
    });
  };

  const handleCrear = () => {
    setAccion(1);
    setAccionId(null);
    handleClose();
    setTimeout(handleShow, 100);
  };

  const handleEditar = async (item: HomeMenuItem) => {
    setAccion(2);
    setAccionId(item.id);
    setFormData({
      title: item.title,
      icon: item.icon,
      color: item.color,
      description: item.description,
      slug: item.slug,
      order: item.order,
      module_id: item.module_id,
    });
    setErrors({});
    setBackendError("");
    setValidated(false);
    handleShow();
  };

  const handleEliminar = (item: HomeMenuItem) => {
    setIsDeleting(item.id);
    showAlert(
      "⚠️ ¿Eliminar Home Menú?",
      `¿Realmente deseas eliminar "${item.title}"? Esta acción no se puede deshacer.`,
      "bg-warning",
      true,
      async () => {
        setIsDeleting(null);
        setAlertData((prev) => ({ ...prev, estado: false }));
        try {
          await homeMenuService.destroy(item.id);
          showAlert("¡Eliminado!", `El ítem "${item.title}" ha sido eliminado.`, "bg-success");
          setTimeout(() => {
            setAlertData((prev) => ({ ...prev, estado: false }));
            loadHomeMenus(pagination.current_page);
          }, 1500);
        } catch (error: any) {
          console.error("Error eliminando:", error);
          showAlert("❌ Error", error.response?.data?.message || "No se pudo eliminar", "bg-danger");
        }
      },
      () => {
        setIsDeleting(null);
        setAlertData((prev) => ({ ...prev, estado: false }));
      }
    );
  };

  // Submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);
    setBackendError("");

    const newErrors: HomeMenuFormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, (formData as any)[key]);
      if (error) newErrors[key as keyof HomeMenuFormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessing(true);
    try {
      if (accion === 1) {
        await homeMenuService.store(formData);
        showAlert("¡Éxito!", "Home Menú creado exitosamente.", "bg-success");
      } else {
        if (accionId) {
          // En edición, construir objeto con solo los campos modificados o enviar todo si el backend lo soporta
          // El backend actualiza con exclude_unset, así que enviamos todo lo que cambió
          // Pero como el frontend controla los campos, podemos enviar formData filtrando module_id null/undefined
          const updateData: any = { ...formData };
          if (updateData.module_id === null) updateData.module_id = null; // Explicit null
          
          await homeMenuService.update(accionId, updateData);
          showAlert("¡Actualizado!", "Home Menú actualizado exitosamente.", "bg-success");
        }
      }
      setTimeout(() => {
        handleClose();
        loadHomeMenus(pagination.current_page);
      }, 1500);
    } catch (error: any) {
      console.error("Error guardando:", error);
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.response?.data?.detail || "Ocurrió un error";

      if (status === 422) {
        const details = error.response?.data?.errors;
        if (details && Array.isArray(details)) {
          const newErrors: HomeMenuFormErrors = {};
          details.forEach((d: any) => {
            if (d.loc?.[1]) newErrors[d.loc[1] as keyof HomeMenuFormErrors] = d.msg;
          });
          setErrors(newErrors);
          showAlert("⚠️ Validación", "Revisa los campos marcados", "bg-warning");
        } else {
          setBackendError(msg);
          showAlert("⚠️ Validación", msg, "bg-warning");
        }
      } else if (status === 409) {
        setBackendError(msg);
        showAlert("⚠️ Conflicto", msg, "bg-warning");
      } else {
        setBackendError(msg);
        showAlert("❌ Error", msg, "bg-danger");
      }
    } finally {
      setProcessing(false);
    }
  };
const getModuleName = (moduleId: number | null): string => {
  if (!moduleId) return '—';
  const module = modules.find((m) => m.id === moduleId);
  return module ? module.name : `ID: ${moduleId}`; // Fallback si no está cargado
};
  return (
    <>
      <AlertCustom
        estado={alertData.estado}
        titulo={alertData.titulo}
        detalle={alertData.detalle}
        headerBg={alertData.headerBg}
        esConfirm={alertData.esConfirm}
        confirmText={alertData.confirmText}
        cancelText={alertData.cancelText}
        onClose={alertData.onClose}
        onConfirm={alertData.onConfirm}
      />

      <div className="container-fluid py-4">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none">
                <i className="fas fa-home"></i> Home
              </Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/admin">Administración</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Home Menú
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="fas fa-th-large me-2 text-primary"></i>
            Home Menú
          </h2>
          <Button variant="primary" onClick={handleCrear}>
            <i className="fas fa-plus me-2"></i>Crear
          </Button>
        </div>

        {/* Badges de información */}
        {pagination.total > 0 && (
          <div className="mb-3">
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <Badge bg="primary" className="px-3 py-2">
                <i className="fas fa-list me-2"></i>
                Total: {pagination.total} registros
              </Badge>
              <Badge bg="info" text="dark" className="px-3 py-2">
                <i className="fas fa-page me-2"></i>
                Página {pagination.current_page} de {pagination.last_page}
              </Badge>
              <Badge bg="secondary" className="px-3 py-2">
                Mostrando: {homeMenus?.length ?? 0} registros
              </Badge>
            </div>
          </div>
        )}

        {/* Tabla o estado vacío */}
        {(homeMenus?.length ?? 0) === 0 && !loading ? (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="fas fa-th-large fa-3x text-muted"></i>
            </div>
            <h5 className="text-muted">No hay ítems en el Home Menú.</h5>
            <p className="text-muted">Comienza creando tu primer acceso.</p>
            <Button variant="outline-primary" onClick={handleCrear} className="mt-2">
              <i className="fas fa-plus me-2"></i>Crear Ítem
            </Button>
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="table-bordered table-hover table-striped mb-0" responsive>
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="px-4 py-3 text-center" style={{ width: "8%" }}>ID</th>
                      <th className="px-4 py-3">Icono</th>
                      <th className="px-4 py-3">Título</th>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3 text-center" style={{ width: "10%" }}>Orden</th>
                      <th className="px-4 py-3">Módulo</th>
                      <th className="px-4 py-3 text-center" style={{ width: "15%" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      (homeMenus ?? []).map((item, index) => (
                        <tr
                          key={item.id}
                          className="align-middle"
                          style={{ backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white" }}
                        >
                          <td className="px-4 py-3 text-center fw-semibold">{item.id}</td>
                          <td className="px-4 py-3 text-center">
                            <span 
                              className="d-inline-flex align-items-center justify-content-center rounded-circle"
                              style={{ 
                                backgroundColor: item.color + "20", 
                                color: item.color,
                                width: "32px", 
                                height: "32px",
                                fontSize: "1.2rem"
                              }}
                            >
                              <i className={`fas fa-${item.icon}`}></i>
                            </span>
                          </td>
                          <td className="px-4 py-3 fw-medium">
                            {item.title}
                          </td>
                          <td className="px-4 py-3">
                            <Badge bg="light" text="dark" className="border">
                              {item.slug}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge bg="secondary">{item.order}</Badge>
                          </td>
                          <td className="px-4 py-3">
  <Badge bg={item.module_id ? "info" : "secondary"} text="dark">
    {getModuleName(item.module_id)}
  </Badge>
</td>
                          <td className="px-4 py-3">
                            <div className="d-flex justify-content-center gap-1">
                              <Button variant="outline-primary" size="sm" onClick={() => handleEditar(item)} title="Editar">
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleEliminar(item)}
                                disabled={isDeleting === item.id}
                                title="Eliminar"
                              >
                                {isDeleting === item.id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <i className="fas fa-trash"></i>
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            {pagination.last_page > 1 && (
              <Card.Footer className="d-flex justify-content-end align-items-center">
                <PaginacionCustom
                  datos={{
                    current_page: pagination.current_page,
                    per_page: pagination.per_page,
                    total: pagination.total,
                    last_page: pagination.last_page,
                  }}
                  onPageChange={(page) => loadHomeMenus(page)}
                />
              </Card.Footer>
            )}
          </Card>
        )}
      </div>

      {/* Modal de Crear/Editar */}
      <Modal show={show} onHide={handleClose} size="lg" centered animation>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Modal.Header
            className="border-0"
            style={{
              background: accion === 1 ? "linear-gradient(90deg, #3b82f6, #2563eb)" : "linear-gradient(90deg, #f59e0b, #d97706)",
              color: "white",
            }}
          >
            <Modal.Title className="fw-bold">
              <i className={`fas ${accion === 1 ? "fa-plus" : "fa-edit"} me-2`}></i>
              {accion === 1 ? "Crear" : "Editar"}
            </Modal.Title>
            <button type="button" className="btn-close btn-close-white" onClick={handleClose}></button>
          </Modal.Header>

          <Modal.Body className="p-4">
            {backendError && (
              <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
                <i className="fas fa-exclamation-circle me-2"></i>
                <span className="small">{backendError}</span>
              </div>
            )}

            <Row className="g-3">
              {/* Icono */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Icono *</Form.Label>
                  <InputGroup>
                    <InputGroup.Text style={{ backgroundColor: formData.color || "#eee" }}>
                      <i className={`fas fa-${formData.icon || "circle"}`} style={{ color: formData.color ? "#fff" : "#333" }}></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="icon"
                      placeholder="Ej: user, home, settings"
                      value={formData.icon}
                      onChange={handleFormChange}
                      isInvalid={!!errors.icon}
                      isValid={validated && !errors.icon && formData.icon !== ""}
                      disabled={processing}
                      autoFocus
                    />
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">{errors.icon}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Color */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Color *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="color"
                      name="color"
                      value={formData.color || "#3B82F6"}
                      onChange={handleFormChange}
                      isInvalid={!!errors.color}
                      disabled={processing}
                      style={{ height: "38px", width: "50px" }}
                    />
                    <Form.Control
                      type="text"
                      name="color"
                      placeholder="#3B82F6"
                      value={formData.color}
                      onChange={handleFormChange}
                      isInvalid={!!errors.color}
                      isValid={validated && !errors.color && formData.color !== ""}
                      disabled={processing}
                    />
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">{errors.color}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Título */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Título *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="Ej: Gestión de Usuarios"
                    value={formData.title}
                    onChange={handleFormChange}
                    isInvalid={!!errors.title}
                    isValid={validated && !errors.title && formData.title !== ""}
                    disabled={processing}
                  />
                  <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              {/* Slug */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Slug *</Form.Label>
                  <Form.Control
                    type="text"
                    name="slug"
                    placeholder="Ej: user-management"
                    value={formData.slug}
                    onChange={handleFormChange}
                    isInvalid={!!errors.slug}
                    isValid={validated && !errors.slug && formData.slug !== ""}
                    disabled={processing}
                    style={{ textTransform: "lowercase" }}
                  />
                  <Form.Control.Feedback type="invalid">{errors.slug}</Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Solo letras minúsculas, números y guiones
                  </Form.Text>
                </Form.Group>
              </Col>

              {/* Orden */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Orden *</Form.Label>
                  <Form.Control
                    type="number"
                    name="order"
                    min={0}
                    value={formData.order}
                    onChange={handleFormChange}
                    isInvalid={!!errors.order}
                    disabled={processing}
                  />
                  <Form.Control.Feedback type="invalid">{errors.order}</Form.Control.Feedback>
                  <Form.Text className="text-muted">Menor número = aparece primero</Form.Text>
                </Form.Group>
              </Col>

              {/* Descripción */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Descripción *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    placeholder="Descripción breve del módulo..."
                    value={formData.description}
                    onChange={handleFormChange}
                    isInvalid={!!errors.description}
                    isValid={validated && !errors.description && formData.description !== ""}
                    disabled={processing}
                  />
                  <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                  <Form.Text className="text-muted">Mínimo 10 caracteres</Form.Text>
                </Form.Group>
              </Col>

              {/* Módulo (Opcional) */}
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Módulo Asociado (Opcional)</Form.Label>
                  <Form.Select
                    name="module_id"
                    value={formData.module_id || ""}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null;
                      setFormData((prev) => ({ ...prev, module_id: value }));
                    }}
                    disabled={processing}
                  >
                    <option value="">Sin módulo (Acceso global)</option>
                    {modules.map((mod) => (
                      <option key={mod.id} value={mod.id}>
                        {mod.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Si seleccionas un módulo, solo usuarios con acceso a él verán este ítem.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={handleClose} disabled={processing}>
              <i className="fas fa-times me-2"></i>Cancelar
            </Button>
            <Button type="submit" variant={accion === 1 ? "primary" : "warning"} disabled={processing}>
              {processing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Procesando...
                </>
              ) : accion === 1 ? (
                <>
                  <i className="fas fa-save me-2"></i>Crear
                </>
              ) : (
                <>
                  <i className="fas fa-edit me-2"></i>Actualizar
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default HomeMenuPage;