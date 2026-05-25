import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Button,
  Table,
  Card,
  InputGroup,
  Badge,
} from "react-bootstrap";
import { appMenuService } from "../services/appMenuService";
import type {
  AppMenuItem,
  AppMenuFormData,
  AppMenuFormErrors,
  AppMenuParentOption,
  AppMenuModuleOption,
} from "../interfaces/AppMenuInterface";
import type { AlertCustomInterface } from "../../../../common/interfaces/AlertCustomInterface";
import AlertCustom from "../../../../common/ui/AlertCustom";
import PaginacionCustom from "../../../../common/ui/PaginacionCustom";
import { Link } from "react-router-dom";

const AppMenuPage: React.FC = () => {
  // Estado de datos
  const [appMenus, setAppMenus] = useState<AppMenuItem[]>([]);
  const [modules, setModules] = useState<AppMenuModuleOption[]>([]);
  const [parentMenus, setParentMenus] = useState<AppMenuParentOption[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 20,
    total: 0,
    last_page: 1,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Estado del modal
  const [show, setShow] = useState(false);
  const [accion, setAccion] = useState<1 | 2>(1); // 1=crear, 2=editar
  const [accionId, setAccionId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState<AppMenuFormData>({
    label: "",
    title: "",
    icon: "fa-circle",
    order: 1,
    parent_id: null,
    module_id: null,
  });

  const [errors, setErrors] = useState<AppMenuFormErrors>({});
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
      case "label":
        if (!value?.trim()) return "La etiqueta es obligatoria";
        if (value.length < 2) return "Mínimo 2 caracteres";
        if (value.length > 200) return "Máximo 200 caracteres";
        return "";
      case "title":
        if (!value?.trim()) return "El título es obligatorio";
        if (value.length < 2) return "Mínimo 2 caracteres";
        if (value.length > 200) return "Máximo 200 caracteres";
        return "";
      case "icon":
        if (!value?.trim()) return "El ícono es obligatorio";
        if (!/^fa[srldb]?\s+fa-/.test(value)) return 'Formato: "fas fa-xxx"';
        return "";
      case "order":
        if (value === undefined || value < 0) return "Debe ser ≥ 0";
        return "";
      case "module_id":
        if (!value || value === 0) return "Seleccione un módulo";
        return "";
      default:
        return "";
    }
  };

  // Manejo de cambios en formulario
  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const fieldValue =
      type === "number" ? (value === "" ? null : parseInt(value)) : value;

    setFormData((prev) => ({ ...prev, [name]: fieldValue }));

    const error = validateField(name, fieldValue);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) newErrors[name as keyof AppMenuFormErrors] = error;
      else delete newErrors[name as keyof AppMenuFormErrors];
      return newErrors;
    });
    if (backendError) setBackendError("");
  };

  // Mostrar alerta reutilizable
  const showAlert = (
    titulo: string,
    detalle: string,
    headerBg: string,
    esConfirm: boolean = false,
    onConfirm?: () => void,
    onCloseOverride?: () => void,
  ) => {
    setAlertData({
      estado: true,
      titulo,
      detalle,
      headerBg,
      esConfirm,
      confirmText: esConfirm ? "Confirmar" : "",
      cancelText: esConfirm ? "Cancelar" : "",
      onClose:
        onCloseOverride ||
        (() => setAlertData((prev) => ({ ...prev, estado: false }))),
      onConfirm,
    });
  };

  // Cargar datos
  const loadAppMenus = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await appMenuService.index(
        page,
        pagination.per_page,
        search,
      );
      setAppMenus(response.data);
      setPagination({
        current_page: response.page,
        per_page: response.limit,
        total: response.total,
        last_page: Math.ceil(response.total / response.limit),
      });
    } catch (error: any) {
      console.error("Error cargando menús:", error);
      showAlert(
        "Error",
        error.response?.data?.mensaje || "No se pudieron cargar los menús",
        "bg-danger",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      const data = await appMenuService.getModules();
      setModules(data);
    } catch (error) {
      console.error("Error cargando módulos:", error);
    }
  };

  const loadParentMenus = async () => {
    try {
      const data = await appMenuService.getParentMenus();
      setParentMenus(data);
    } catch (error) {
      console.error("Error cargando menús padres:", error);
    }
  };

  useEffect(() => {
    loadAppMenus();
    loadModules();
    loadParentMenus();
  }, []);

  // Manejo del modal
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setValidated(false);
    setErrors({});
    setBackendError("");
    setFormData({
      label: "",
      title: "",
      icon: "fa-circle",
      order: 1,
      parent_id: null,
      module_id: null,
    });
  };

  const handleCrear = () => {
    setAccion(1);
    setAccionId(null);
    handleClose(); // Resetear primero
    setTimeout(handleShow, 100); // Luego abrir
  };

  const handleEditar = async (menu: AppMenuItem) => {
    setAccion(2);
    setAccionId(menu.id);
    setFormData({
      label: menu.label,
      title: menu.title,
      icon: menu.icon,
      order: menu.order,
      parent_id: menu.parent_id,
      module_id: menu.module_id,
    });
    setErrors({});
    setBackendError("");
    setValidated(false);
    handleShow();
  };

  const handleEliminar = (menu: AppMenuItem) => {
    setIsDeleting(menu.id);
    showAlert(
      "⚠️ ¿Eliminar menú?",
      `¿Realmente deseas eliminar "${menu.label}"? Esta acción no se puede deshacer.`,
      "bg-warning",
      true,
      async () => {
        setIsDeleting(null);
        setAlertData((prev) => ({ ...prev, estado: false }));
        try {
          await appMenuService.destroy(menu.id);
          showAlert(
            "¡Eliminado!",
            `El menú "${menu.label}" ha sido eliminado.`,
            "bg-success",
          );
          setTimeout(() => {
            setAlertData((prev) => ({ ...prev, estado: false }));
            loadAppMenus(pagination.current_page);
          }, 1500);
        } catch (error: any) {
          console.error("Error eliminando:", error);
          showAlert(
            "❌ Error",
            error.response?.data?.mensaje || "No se pudo eliminar",
            "bg-danger",
          );
        }
      },
      () => {
        setIsDeleting(null);
        setAlertData((prev) => ({ ...prev, estado: false }));
      },
    );
  };

  // Submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);
    setBackendError("");

    // Validar todos los campos
    const newErrors: AppMenuFormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, (formData as any)[key]);
      if (error) newErrors[key as keyof AppMenuFormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessing(true);
    try {
      if (accion === 1) {
        await appMenuService.store(formData);
        showAlert("¡Éxito!", "Menú creado exitosamente.", "bg-success");
      } else {
        if (accionId) {
          await appMenuService.update(accionId, formData);
          showAlert(
            "¡Actualizado!",
            "Menú actualizado exitosamente.",
            "bg-success",
          );
        }
      }
      setTimeout(() => {
        handleClose();
        loadAppMenus(pagination.current_page);
      }, 1500);
    } catch (error: any) {
      console.error("Error guardando:", error);
      const status = error.response?.status;
      const msg = error.response?.data?.mensaje || "Ocurrió un error";

      if (status === 422) {
        // Validación del backend
        const details = error.response?.data?.errores;
        if (details && Array.isArray(details)) {
          const newErrors: AppMenuFormErrors = {};
          details.forEach((d: any) => {
            if (d.campo)
              newErrors[d.campo as keyof AppMenuFormErrors] = d.mensaje;
          });
          setErrors(newErrors);
          showAlert(
            "⚠️ Validación",
            "Revisa los campos marcados",
            "bg-warning",
          );
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

  // Búsqueda
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAppMenus(1);
  };

  return (
    <>
      {/* Alerta global reutilizable */}
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
              Menús de Aplicación
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="fas fa-list-ul me-2 text-primary"></i>
            Menús de Aplicación
          </h2>
          <Button variant="primary" onClick={handleCrear}>
            <i className="fas fa-plus me-2"></i>Crear
          </Button>
        </div>

        {/* Buscador */}
        <Card className="border-0 shadow-sm mb-3">
          <Card.Body>
            <Form onSubmit={handleSearchSubmit} className="d-flex gap-2">
              <InputGroup>
                <InputGroup.Text>
                  <i className="fas fa-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar por label o título..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
              <Button type="submit" variant="primary">
                <i className="fas fa-search"></i>
              </Button>
              {search && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    loadAppMenus(1);
                  }}
                >
                  <i className="fas fa-times"></i>
                </Button>
              )}
            </Form>
          </Card.Body>
        </Card>

        {/* ✅ Badges de información - SIEMPRE VISIBLES (arriba de la tabla) */}
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
                Mostrando: {appMenus.length} registros
              </Badge>
            </div>
          </div>
        )}

        {/* Tabla o estado vacío */}
        {pagination.total === 0 && !loading ? (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="fas fa-bars fa-3x text-muted"></i>
            </div>
            <h5 className="text-muted">No hay menús registrados.</h5>
            <p className="text-muted">Comienza creando tu primer menú.</p>
            <Button
              variant="outline-primary"
              onClick={handleCrear}
              className="mt-2"
            >
              <i className="fas fa-plus me-2"></i>Crear Menú
            </Button>
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table
                  className="table-bordered table-hover table-striped mb-0"
                  responsive
                >
                  <thead className="bg-primary text-white">
                    <tr>
                      <th
                        className="px-4 py-3 text-center"
                        style={{ width: "8%" }}
                      >
                        ID
                      </th>
                      <th className="px-4 py-3">Label</th>
                      <th className="px-4 py-3">Título</th>
                      <th
                        className="px-4 py-3 text-center"
                        style={{ width: "12%" }}
                      >
                        Icono
                      </th>
                      <th
                        className="px-4 py-3 text-center"
                        style={{ width: "10%" }}
                      >
                        Orden
                      </th>
                      <th className="px-4 py-3">Padre</th>
                      <th className="px-4 py-3">Módulo</th>
                      <th
                        className="px-4 py-3 text-center"
                        style={{ width: "15%" }}
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      appMenus.map((menu, index) => (
                        <tr
                          key={menu.id}
                          className="align-middle"
                          style={{
                            backgroundColor:
                              index % 2 === 0 ? "#f8f9fa" : "white",
                          }}
                        >
                          <td className="px-4 py-3 text-center fw-semibold">
                            {menu.id}
                          </td>
                          <td className="px-4 py-3 fw-medium">{menu.label}</td>
                          <td className="px-4 py-3 text-muted small">
                            {menu.title}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <i
                              className={`${menu.icon} fa-lg text-primary`}
                            ></i>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge bg="light" text="dark" className="border">
                              {menu.order}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {menu.parent?.label ? (
                              <Badge bg="info" text="dark">
                                <i className="fas fa-sitemap me-1"></i>
                                {menu.parent.label}
                              </Badge>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {menu.module_slug ? (
                              <Badge bg="secondary">{menu.module_slug}</Badge>
                            ) : (
                              <span className="text-muted small">
                                Sin módulo
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex justify-content-center gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditar(menu)}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleEliminar(menu)}
                                disabled={isDeleting === menu.id}
                              >
                                {isDeleting === menu.id ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
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
            {/* Paginación solo en el footer si hay más de 1 página */}
            {pagination.last_page > 1 && (
              <Card.Footer className="d-flex justify-content-end align-items-center">
                <PaginacionCustom
                  datos={{
                    current_page: pagination.current_page,
                    per_page: pagination.per_page,
                    total: pagination.total,
                    last_page: pagination.last_page,
                  }}
                  onPageChange={(page) => loadAppMenus(page)}
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
              background:
                accion === 1
                  ? "linear-gradient(90deg, #3b82f6, #2563eb)"
                  : "linear-gradient(90deg, #f59e0b, #d97706)",
              color: "white",
            }}
          >
            <Modal.Title className="fw-bold">
              <i
                className={`fas ${accion === 1 ? "fa-plus-circle" : "fa-edit"} me-2`}
              ></i>
              {accion === 1 ? "Crear Menú" : "Editar Menú"}
            </Modal.Title>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleClose}
            ></button>
          </Modal.Header>

          <Modal.Body className="p-4">
            {backendError && (
              <div
                className="alert alert-danger d-flex align-items-center mb-3"
                role="alert"
              >
                <i className="fas fa-exclamation-circle me-2"></i>
                <span className="small">{backendError}</span>
              </div>
            )}

            <div className="row g-3">
              {/* Label */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold">Label *</Form.Label>
                  <Form.Control
                    type="text"
                    name="label"
                    placeholder="Ej: Usuarios"
                    value={formData.label}
                    onChange={handleFormChange}
                    isInvalid={!!errors.label}
                    isValid={
                      validated && !errors.label && formData.label !== ""
                    }
                    disabled={processing}
                    autoFocus
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.label}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              {/* Title */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold">Título *</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="Ej: Gestión de Usuarios"
                    value={formData.title}
                    onChange={handleFormChange}
                    isInvalid={!!errors.title}
                    isValid={
                      validated && !errors.title && formData.title !== ""
                    }
                    disabled={processing}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.title}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              {/* Icon - ✅ CAMBIO: Input de texto libre SIN autocompletado */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold">Icono *</Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className={`fas ${formData.icon || "fa-circle"}`}></i>
                    </span>
                    <Form.Control
                      type="text"
                      name="icon"
                      placeholder="Ej: fas fa-shield-alt"
                      value={formData.icon || ""}
                      onChange={handleFormChange}
                      isInvalid={!!errors.icon}
                      isValid={
                        validated && !errors.icon && formData.icon !== ""
                      }
                      disabled={processing}
                      // ✅ Eliminado: list="icon-suggestions"
                    />
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.icon}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Formato: <code>fas fa-xxx</code>. Ver{" "}
                    <a
                      href="https://fontawesome.com/icons"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      fontawesome.com
                    </a>
                  </Form.Text>
                </Form.Group>
              </div>

              {/* Order */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold">Orden *</Form.Label>
                  <Form.Control
                    type="number"
                    name="order"
                    min={0}
                    value={formData.order || 0}
                    onChange={handleFormChange}
                    isInvalid={!!errors.order}
                    disabled={processing}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.order}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Menor número = aparece primero
                  </Form.Text>
                </Form.Group>
              </div>

              {/* Parent */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold">Menú Padre</Form.Label>
                  <Form.Select
                    name="parent_id"
                    value={formData.parent_id || ""}
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseInt(e.target.value)
                        : null;
                      setFormData((prev) => ({ ...prev, parent_id: value }));
                    }}
                    disabled={processing}
                  >
                    <option value="">Sin padre (menú principal)</option>
                    {parentMenus.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              {/* Module */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold">Módulo Asociado *</Form.Label>
                  <Form.Select
                    name="module_id"
                    value={formData.module_id || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setFormData((prev) => ({ ...prev, module_id: value }));
                    }}
                    isInvalid={!!errors.module_id}
                    disabled={processing}
                  >
                    <option value="">Seleccione un módulo</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.name} ({module.slug})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.module_id}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Si se asigna, solo usuarios con acceso a este módulo podrán
                    verlo
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={processing}
            >
              <i className="fas fa-times me-2"></i>Cancelar
            </Button>
            <Button
              type="submit"
              variant={accion === 1 ? "primary" : "warning"}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
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

export default AppMenuPage;