import { useState, useEffect } from "react";
import { Modal, Form, Button, Table, Card, InputGroup, Badge } from "react-bootstrap";
import { profileService } from "../services/profileService";
import type {
  ProfileItem,
  ProfileFormData,
  ProfileFormErrors,
  ProfileListResponse,
} from "../interfaces/ProfileInterface";
import type { AlertCustomInterface } from "../../../../common/interfaces/AlertCustomInterface";
import AlertCustom from "../../../../common/ui/AlertCustom";
import PaginacionCustom from "../../../../common/ui/PaginacionCustom";
import { Link } from "react-router-dom";

const ProfilePage: React.FC = () => {
  // Estado de datos
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
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
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    description: "",
  });

  const [errors, setErrors] = useState<ProfileFormErrors>({});
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
      case "description":
        if (!value?.trim()) return "La descripción es obligatoria";
        if (value.length < 10) return "Mínimo 10 caracteres";
        if (value.length > 500) return "Máximo 500 caracteres";
        return "";
      default:
        return "";
    }
  };

  // Manejo de cambios en formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) newErrors[name as keyof ProfileFormErrors] = error;
      else delete newErrors[name as keyof ProfileFormErrors];
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
  const loadProfiles = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await profileService.index(page, pagination.per_page, search);
      setProfiles(response.data);
      setPagination({
        current_page: response.page,
        per_page: response.limit,
        total: response.total,
        last_page: Math.ceil(response.total / response.limit),
      });
    } catch (error: any) {
      console.error("Error cargando perfiles:", error);
      showAlert("Error", error.response?.data?.detail || "No se pudieron cargar los perfiles", "bg-danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  // Manejo del modal
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setValidated(false);
    setErrors({});
    setBackendError("");
    setFormData({ name: "", description: "" });
  };

  const handleCrear = () => {
    setAccion(1);
    setAccionId(null);
    handleClose();
    setTimeout(handleShow, 100);
  };

  const handleEditar = async (profile: ProfileItem) => {
    setAccion(2);
    setAccionId(profile.id);
    setFormData({
      name: profile.name,
      description: profile.description,
    });
    setErrors({});
    setBackendError("");
    setValidated(false);
    handleShow();
  };

  const handleEliminar = (profile: ProfileItem) => {
    setIsDeleting(profile.id);
    showAlert(
      "⚠️ ¿Eliminar perfil?",
      `¿Realmente deseas eliminar "${profile.name}"? Esta acción no se puede deshacer.`,
      "bg-warning",
      true,
      async () => {
        setIsDeleting(null);
        setAlertData((prev) => ({ ...prev, estado: false }));
        try {
          await profileService.destroy(profile.id);
          showAlert("¡Eliminado!", `El perfil "${profile.name}" ha sido eliminado.`, "bg-success");
          setTimeout(() => {
            setAlertData((prev) => ({ ...prev, estado: false }));
            loadProfiles(pagination.current_page);
          }, 1500);
        } catch (error: any) {
          console.error("Error eliminando:", error);
          showAlert("❌ Error", error.response?.data?.detail || "No se pudo eliminar", "bg-danger");
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

    const newErrors: ProfileFormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, (formData as any)[key]);
      if (error) newErrors[key as keyof ProfileFormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessing(true);
    try {
      if (accion === 1) {
        await profileService.store(formData);
        showAlert("¡Éxito!", "Perfil creado exitosamente.", "bg-success");
      } else {
        if (accionId) {
          await profileService.update(accionId, formData);
          showAlert("¡Actualizado!", "Perfil actualizado exitosamente.", "bg-success");
        }
      }
      setTimeout(() => {
        handleClose();
        loadProfiles(pagination.current_page);
      }, 1500);
    } catch (error: any) {
      console.error("Error guardando:", error);
      const status = error.response?.status;
      const msg = error.response?.data?.detail || "Ocurrió un error";

      if (status === 422) {
        const details = error.response?.data?.errors;
        if (details && Array.isArray(details)) {
          const newErrors: ProfileFormErrors = {};
          details.forEach((d: any) => {
            if (d.loc?.[1]) newErrors[d.loc[1] as keyof ProfileFormErrors] = d.msg;
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

  // Búsqueda
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProfiles(1);
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
              Perfiles
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="fas fa-user-tag me-2 text-primary"></i>
            Perfiles
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
                  placeholder="Buscar por nombre o descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
              <Button type="submit" variant="primary">
                <i className="fas fa-search"></i>
              </Button>
              {search && (
                <Button type="button" variant="secondary" onClick={() => { setSearch(""); loadProfiles(1); }}>
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
                Mostrando: {profiles.length} registros
              </Badge>
            </div>
          </div>
        )}

        {/* Tabla o estado vacío */}
        {pagination.total === 0 && !loading ? (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="fas fa-user-tag fa-3x text-muted"></i>
            </div>
            <h5 className="text-muted">No hay perfiles registrados.</h5>
            <p className="text-muted">Comienza creando tu primer perfil.</p>
            <Button variant="outline-primary" onClick={handleCrear} className="mt-2">
              <i className="fas fa-plus me-2"></i>Crear Perfil
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
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3 text-center" style={{ width: "15%" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      profiles.map((profile, index) => (
                        <tr key={profile.id} className="align-middle" style={{ backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white" }}>
                          <td className="px-4 py-3 text-center fw-semibold">{profile.id}</td>
                          <td className="px-4 py-3 fw-medium">
                            <Badge bg="info" text="dark">
                              <i className="fas fa-user-tag me-1"></i>
                              {profile.name}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted small">{profile.description}</td>
                          <td className="px-4 py-3">
                            <div className="d-flex justify-content-center gap-2">
                              <Button variant="outline-primary" size="sm" onClick={() => handleEditar(profile)}>
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleEliminar(profile)}
                                disabled={isDeleting === profile.id}
                              >
                                {isDeleting === profile.id ? (
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
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
                  onPageChange={(page) => loadProfiles(page)}
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
              background: accion === 1
                ? "linear-gradient(90deg, #3b82f6, #2563eb)"
                : "linear-gradient(90deg, #f59e0b, #d97706)",
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

            <div className="row g-3">
              {/* Nombre */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="fw-bold">Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Ej: Administrador"
                    value={formData.name}
                    onChange={handleFormChange}
                    isInvalid={!!errors.name}
                    isValid={validated && !errors.name && formData.name !== ""}
                    disabled={processing}
                    autoFocus
                  />
                  <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                </Form.Group>
              </div>

              {/* Descripción */}
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="fw-bold">Descripción *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    placeholder="Describe los permisos y alcance de este perfil..."
                    value={formData.description}
                    onChange={handleFormChange}
                    isInvalid={!!errors.description}
                    isValid={validated && !errors.description && formData.description !== ""}
                    disabled={processing}
                  />
                  <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Mínimo 10 caracteres, máximo 500
                  </Form.Text>
                </Form.Group>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0">
            <Button variant="secondary" onClick={handleClose} disabled={processing}>
              <i className="fas fa-times me-2"></i>Cancelar
            </Button>
            <Button
              type="submit"
              variant={accion === 1 ? "primary" : "warning"}
              disabled={processing}
            >
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

export default ProfilePage;
