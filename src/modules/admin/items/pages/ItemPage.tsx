import { useState, useEffect } from "react";
import {  Link } from "react-router-dom";
import {
  Modal,
  Form,
  Button,
  Table,
  Card,
  InputGroup,
  Badge,
} from "react-bootstrap";
import { itemService } from "../services/itemService";
import type {
  ItemItem,
  ItemFormData,
  ItemFormErrors,
} from "../interfaces/ItemInterface";
import type { AlertCustomInterface } from "../../../../common/interfaces/AlertCustomInterface";
import AlertCustom from "../../../../common/ui/AlertCustom";
import PaginacionCustom from "../../../../common/ui/PaginacionCustom";

const ItemPage: React.FC = () => {

  // Estado de datos
  const [items, setItems] = useState<ItemItem[]>([]);
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
  const [accion, setAccion] = useState<1 | 2>(1);
  const [accionId, setAccionId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [validated, setValidated] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState<ItemFormData>({
    name: "",
    code: "",
  });

  const [errors, setErrors] = useState<ItemFormErrors>({});
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
      case "name":
        if (!value?.trim()) return "El nombre es obligatorio";
        if (value.length < 2) return "Mínimo 2 caracteres";
        if (value.length > 100) return "Máximo 100 caracteres";
        return "";
      case "code":
        if (!value?.trim()) return "El código es obligatorio";
        if (value.length < 2) return "Mínimo 2 caracteres";
        if (value.length > 50) return "Máximo 50 caracteres";
        // ✅ Validar sin convertir a mayúsculas
        if (!/^[A-Za-z0-9\-_]+$/.test(value)) {
          return "Solo letras, números, guiones y guiones bajos";
        }
        return "";
      default:
        return "";
    }
  };

  // Manejo de cambios en formulario
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    // ✅ Sin conversión automática a mayúsculas
    setFormData((prev) => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) newErrors[name as keyof ItemFormErrors] = error;
      else delete newErrors[name as keyof ItemFormErrors];
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
  const loadItems = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await itemService.index(
        page,
        pagination.per_page,
        search,
      );
      setItems(response.data ?? []);
      setPagination({
        current_page: response.page,
        per_page: response.limit,
        total: response.total,
        last_page: Math.ceil(response.total / response.limit),
      });
    } catch (error: any) {
      console.error("Error cargando ítems:", error);
      showAlert(
        "Error",
        error.response?.data?.detail || "No se pudieron cargar los ítems",
        "bg-danger",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Manejo del modal
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setValidated(false);
    setErrors({});
    setBackendError("");
    setFormData({ name: "", code: "" });
  };

  const handleCrear = () => {
    setAccion(1);
    setAccionId(null);
    handleClose();
    setTimeout(handleShow, 100);
  };

  const handleEditar = async (item: ItemItem) => {
    setAccion(2);
    setAccionId(item.id);
    setFormData({
      name: item.name,
      code: item.code,
    });
    setErrors({});
    setBackendError("");
    setValidated(false);
    handleShow();
  };

  const handleEliminar = (item: ItemItem) => {
    setIsDeleting(item.id);
    showAlert(
      "⚠️ ¿Eliminar ítem?",
      `¿Realmente deseas eliminar "${item.name}"? Esta acción no se puede deshacer.`,
      "bg-warning",
      true,
      async () => {
        setIsDeleting(null);
        setAlertData((prev) => ({ ...prev, estado: false }));
        try {
          await itemService.destroy(item.id);
          showAlert(
            "¡Eliminado!",
            `El ítem "${item.name}" ha sido eliminado.`,
            "bg-success",
          );
          setTimeout(() => {
            setAlertData((prev) => ({ ...prev, estado: false }));
            loadItems(pagination.current_page);
          }, 1500);
        } catch (error: any) {
          console.error("Error eliminando:", error);
          showAlert(
            "❌ Error",
            error.response?.data?.detail || "No se pudo eliminar",
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

    const newErrors: ItemFormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, (formData as any)[key]);
      if (error) newErrors[key as keyof ItemFormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessing(true);
    try {
      if (accion === 1) {
        await itemService.store(formData);
        showAlert("¡Éxito!", "Ítem creado exitosamente.", "bg-success");
      } else {
        if (accionId) {
          await itemService.update(accionId, formData);
          showAlert(
            "¡Actualizado!",
            "Ítem actualizado exitosamente.",
            "bg-success",
          );
        }
      }
      setTimeout(() => {
        handleClose();
        loadItems(pagination.current_page);
      }, 1500);
    } catch (error: any) {
      console.error("Error guardando:", error);
      const status = error.response?.status;
      const msg = error.response?.data?.detail || "Ocurrió un error";

      if (status === 422) {
        const details = error.response?.data?.errors;
        if (details && Array.isArray(details)) {
          const newErrors: ItemFormErrors = {};
          details.forEach((d: any) => {
            if (d.loc?.[1])
              newErrors[d.loc[1] as keyof ItemFormErrors] = d.msg;
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
    loadItems(1);
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
              Ítems
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="fas fa-cubes me-2 text-primary"></i>
            Ítems
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
                  placeholder="Buscar por nombre o código..."
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
                    loadItems(1);
                  }}
                >
                  <i className="fas fa-times"></i>
                </Button>
              )}
            </Form>
          </Card.Body>
        </Card>

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
                Mostrando: {items?.length ?? 0} registros
              </Badge>
            </div>
          </div>
        )}

        {/* Tabla o estado vacío */}
        {(items?.length ?? 0) === 0 && !loading ? (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="fas fa-cubes fa-3x text-muted"></i>
            </div>
            <h5 className="text-muted">No hay ítems registrados.</h5>
            <p className="text-muted">Comienza creando tu primer ítem.</p>
            <Button
              variant="outline-primary"
              onClick={handleCrear}
              className="mt-2"
            >
              <i className="fas fa-plus me-2"></i>Crear Ítem
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
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Nombre</th>
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
                        <td colSpan={4} className="text-center py-4">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      (items ?? []).map((item, index) => (
                        <tr
                          key={item.id}
                          className="align-middle"
                          style={{
                            backgroundColor:
                              index % 2 === 0 ? "#f8f9fa" : "white",
                          }}
                        >
                          <td className="px-4 py-3 text-center fw-semibold">
                            {item.id}
                          </td>
                          <td className="px-4 py-3">
                            {/* ✅ Sin ícono, solo el código */}
                            <Badge bg="secondary" className="py-1 px-2">
                              {item.code}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 fw-medium">{item.name}</td>
                          <td className="px-4 py-3">
                            <div className="d-flex justify-content-center gap-1">
                              {/* Editar */}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditar(item)}
                                title="Editar ítem"
                              >
                                <i className="fas fa-edit"></i>
                              </Button>

                              {/* Eliminar */}
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleEliminar(item)}
                                disabled={isDeleting === item.id}
                                title="Eliminar ítem"
                              >
                                {isDeleting === item.id ? (
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
            {pagination.last_page > 1 && (
              <Card.Footer className="d-flex justify-content-end align-items-center">
                <PaginacionCustom
                  datos={{
                    current_page: pagination.current_page,
                    per_page: pagination.per_page,
                    total: pagination.total,
                    last_page: pagination.last_page,
                  }}
                  onPageChange={(page) => loadItems(page)}
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
                className={`fas ${accion === 1 ? "fa-plus" : "fa-edit"} me-2`}
              ></i>
              {accion === 1 ? "Crear" : "Editar"}
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
              {/* Código */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="fw-bold">Código *</Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    placeholder="Ej: view_all_register"
                    value={formData.code}
                    onChange={handleFormChange}
                    isInvalid={!!errors.code}
                    isValid={validated && !errors.code && formData.code !== ""}
                    disabled={processing}
                    autoFocus
                    // ✅ Sin textTransform: uppercase
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.code}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Solo letras, números, guiones y guiones bajos
                  </Form.Text>
                </Form.Group>
              </div>

              {/* Nombre */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="fw-bold">Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Ej: Ver todos los registros"
                    value={formData.name}
                    onChange={handleFormChange}
                    isInvalid={!!errors.name}
                    isValid={validated && !errors.name && formData.name !== ""}
                    disabled={processing}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
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

export default ItemPage;