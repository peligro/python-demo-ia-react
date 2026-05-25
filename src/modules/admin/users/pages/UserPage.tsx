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
import { userService } from "../services/userService";
import type {
  UserItem,
  UserFormData,
  UserFormErrors,
  UserProfileOption,
  UserStateOption,
} from "../interfaces/UserInterface";
import type { AlertCustomInterface } from "../../../../common/interfaces/AlertCustomInterface";
import AlertCustom from "../../../../common/ui/AlertCustom";
import PaginacionCustom from "../../../../common/ui/PaginacionCustom";
import { Link } from "react-router-dom";

const UserPage: React.FC = () => {
  // Estado de datos
  const [users, setUsers] = useState<UserItem[]>([]);
  const [profiles, setProfiles] = useState<UserProfileOption[]>([]);
  const [states, setStates] = useState<UserStateOption[]>([]);
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
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: null,
    state_id: null,
    profile_id: null,
  });

  const [errors, setErrors] = useState<UserFormErrors>({});
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
        if (value.length > 200) return "Máximo 200 caracteres";
        return "";
      case "email":
        if (!value?.trim()) return "El email es obligatorio";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Formato de email inválido";
        if (value.length > 200) return "Máximo 200 caracteres";
        return "";
      case "password":
        if (accion === 1 && !value?.trim())
          return "La contraseña es obligatoria";
        if (accion === 2 && value && value.length < 6)
          return "Mínimo 6 caracteres";
        if (value && value.length > 200) return "Máximo 200 caracteres";
        return "";
      case "confirm_password":
        if (accion === 1 && value !== formData.password) {
          return "Las contraseñas no coinciden";
        }
        return "";
      case "phone":
        if (value && value.length > 50) return "Máximo 50 caracteres";
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
    const { name, value } = e.target;
    const fieldValue = value === "" ? null : value;

    setFormData((prev) => ({ ...prev, [name]: fieldValue }));

    const error = validateField(name, fieldValue);
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (error) newErrors[name as keyof UserFormErrors] = error;
      else delete newErrors[name as keyof UserFormErrors];
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
  const loadUsers = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await userService.index(
        page,
        pagination.per_page,
        search,
      );
      setUsers(response.data);
      setPagination({
        current_page: response.page,
        per_page: response.limit,
        total: response.total,
        last_page: Math.ceil(response.total / response.limit),
      });
    } catch (error: any) {
      console.error("Error cargando usuarios:", error);
      showAlert(
        "Error",
        error.response?.data?.mensaje || "No se pudieron cargar los usuarios",
        "bg-danger",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const data = await userService.getProfiles();
      setProfiles(data);
    } catch (error) {
      console.error("Error cargando perfiles:", error);
    }
  };

  const loadStates = async () => {
    try {
      const data = await userService.getStates();
      // ✅ Filtrar solo estados 1 y 2 (Activo/No Activo)
      const filteredStates = data.filter((s) => s.id === 1 || s.id === 2);
      setStates(filteredStates);
    } catch (error) {
      console.error("Error cargando estados:", error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadProfiles();
    loadStates();
  }, []);

  // Manejo del modal
  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setValidated(false);
    setErrors({});
    setBackendError("");
    setFormData({
      name: "",
      email: "",
      password: "",
      confirm_password: "",
      phone: null,
      state_id: null,
      profile_id: null,
    });
  };

  const handleCrear = () => {
    setAccion(1);
    setAccionId(null);
    handleClose();
    setTimeout(handleShow, 100);
  };

  const handleEditar = async (user: UserItem) => {
    setAccion(2);
    setAccionId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // No mostrar password actual
      confirm_password: "",
      phone: user.phone || user.user_meta?.phone || null,
      // ✅ Acceder desde user_meta
      state_id: user.user_meta?.state?.id || null,
      profile_id: user.user_meta?.profile?.id || null,
    });
    setErrors({});
    setBackendError("");
    setValidated(false);
    handleShow();
  };

  const handleEliminar = (user: UserItem) => {
    setIsDeleting(user.id);
    showAlert(
      "⚠️ ¿Eliminar usuario?",
      `¿Realmente deseas eliminar a "${user.name}"? Esta acción no se puede deshacer.`,
      "bg-warning",
      true,
      async () => {
        setIsDeleting(null);
        setAlertData((prev) => ({ ...prev, estado: false }));
        try {
          await userService.destroy(user.id);
          showAlert(
            "¡Eliminado!",
            `El usuario "${user.name}" ha sido eliminado.`,
            "bg-success",
          );
          setTimeout(() => {
            setAlertData((prev) => ({ ...prev, estado: false }));
            loadUsers(pagination.current_page);
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
    const newErrors: UserFormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, (formData as any)[key]);
      if (error) newErrors[key as keyof UserFormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setProcessing(true);
    try {
      if (accion === 1) {
        await userService.store(formData);
        showAlert("¡Éxito!", "Usuario creado exitosamente.", "bg-success");
      } else {
        if (accionId) {
          // ✅ En edición, enviar SOLO los campos que cambiaron
          const updateData: any = {
            name: formData.name,
            email: formData.email,
          };

          // Agregar teléfono si existe
          if (formData.phone) {
            updateData.phone = formData.phone;
          }

          // Agregar contraseña solo si se cambió
          if (formData.password) {
            updateData.password = formData.password;
          }

          // Agregar estado si se seleccionó
          if (formData.state_id) {
            updateData.state_id = formData.state_id;
          }

          // Agregar perfil si se seleccionó
          if (formData.profile_id) {
            updateData.profile_id = formData.profile_id;
          }

          await userService.update(accionId, updateData);
          showAlert(
            "¡Actualizado!",
            "Usuario actualizado exitosamente.",
            "bg-success",
          );
        }
      }
      setTimeout(() => {
        handleClose();
        loadUsers(pagination.current_page);
      }, 1500);
    } catch (error: any) {
      console.error("Error guardando:", error);
      const status = error.response?.status;
      const msg = error.response?.data?.mensaje || "Ocurrió un error";

      if (status === 422) {
        const details = error.response?.data?.errores;
        if (details && Array.isArray(details)) {
          const newErrors: UserFormErrors = {};
          details.forEach((d: any) => {
            if (d.campo) newErrors[d.campo as keyof UserFormErrors] = d.mensaje;
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
    loadUsers(1);
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
              Usuarios
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">
            <i className="fas fa-users me-2 text-primary"></i>
            Usuarios
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
                  placeholder="Buscar por nombre o email..."
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
                    loadUsers(1);
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
                Mostrando: {users.length} registros
              </Badge>
            </div>
          </div>
        )}

        {/* Tabla o estado vacío */}
        {pagination.total === 0 && !loading ? (
          <div className="text-center py-5">
            <div className="mb-3">
              <i className="fas fa-user-slash fa-3x text-muted"></i>
            </div>
            <h5 className="text-muted">No hay usuarios registrados.</h5>
            <p className="text-muted">Comienza creando tu primer usuario.</p>
            <Button
              variant="outline-primary"
              onClick={handleCrear}
              className="mt-2"
            >
              <i className="fas fa-plus me-2"></i>Crear Usuario
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
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Teléfono</th>
                      <th className="px-4 py-3">Perfil</th>
                      <th className="px-4 py-3">Estado</th>
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
                        <td colSpan={7} className="text-center py-4">
                          <div
                            className="spinner-border text-primary"
                            role="status"
                          >
                            <span className="visually-hidden">Cargando...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user, index) => (
                        <tr
                          key={user.id}
                          className="align-middle"
                          style={{
                            backgroundColor:
                              index % 2 === 0 ? "#f8f9fa" : "white",
                          }}
                        >
                          <td className="px-4 py-3 text-center fw-semibold">
                            {user.id}
                          </td>
                          <td className="px-4 py-3 fw-medium">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "32px", height: "32px" }}
                              >
                                <i className="fas fa-user text-primary"></i>
                              </div>
                              {user.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted small">
                            {user.email}
                          </td>
                          <td className="px-4 py-3">
                            {user.phone || user.user_meta?.phone || (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {/* ✅ Acceder desde user_meta */}
                            {user.user_meta?.profile?.name ? (
                              <Badge bg="info" text="dark">
                                <i className="fas fa-user-tag me-1"></i>
                                {user.user_meta.profile.name}
                              </Badge>
                            ) : (
                              <Badge bg="secondary">Sin perfil</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {/* ✅ Acceder desde user_meta */}
                            {user.user_meta?.state?.name ? (
                              <Badge
                                bg={
                                  user.user_meta.state.name === "Activo"
                                    ? "success"
                                    : "danger"
                                }
                              >
                                {user.user_meta.state.name}
                              </Badge>
                            ) : (
                              <Badge bg="warning" text="dark">
                                Desconocido
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="d-flex justify-content-center gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditar(user)}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleEliminar(user)}
                                disabled={isDeleting === user.id}
                              >
                                {isDeleting === user.id ? (
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
                  onPageChange={(page) => loadUsers(page)}
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
              {/* Nombre */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold">Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Ej: Juan Pérez"
                    value={formData.name}
                    onChange={handleFormChange}
                    isInvalid={!!errors.name}
                    isValid={validated && !errors.name && formData.name !== ""}
                    disabled={processing}
                    autoFocus
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              {/* Email */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold">Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Ej: juan@ejemplo.com"
                    value={formData.email || ""}
                    onChange={handleFormChange}
                    isInvalid={!!errors.email}
                    isValid={
                      validated && !errors.email && formData.email !== ""
                    }
                    disabled={processing}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              {/* Contraseña */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Contraseña{" "}
                    {accion === 2 && (
                      <span className="text-muted">
                        (dejar vacío para mantener)
                      </span>
                    )}{" "}
                    *
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder={
                      accion === 1
                        ? "Mínimo 6 caracteres"
                        : "Nueva contraseña (opcional)"
                    }
                    value={formData.password || ""}
                    onChange={handleFormChange}
                    isInvalid={!!errors.password}
                    isValid={
                      accion === 1 &&
                      validated &&
                      !errors.password &&
                      formData.password !== ""
                    }
                    disabled={processing}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              {/* Confirmar Contraseña - SOLO EN CREAR */}
              {accion === 1 && (
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      Confirmar Contraseña *
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="confirm_password"
                      placeholder="Repita la contraseña"
                      value={formData.confirm_password || ""}
                      onChange={handleFormChange}
                      isInvalid={!!errors.confirm_password}
                      isValid={
                        validated &&
                        !errors.confirm_password &&
                        formData.confirm_password !== ""
                      }
                      disabled={processing}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirm_password}
                    </Form.Control.Feedback>
                  </Form.Group>
                </div>
              )}

              {/* Teléfono */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-bold">Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    placeholder="Ej: +56 9 1234 5678"
                    value={formData.phone || ""}
                    onChange={handleFormChange}
                    isInvalid={!!errors.phone}
                    disabled={processing}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              {/* Perfil - SOLO EN EDITAR */}
              {accion === 2 && (
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="fw-bold">Perfil</Form.Label>
                    <Form.Select
                      name="profile_id"
                      value={formData.profile_id || ""}
                      onChange={handleFormChange}
                      disabled={processing}
                    >
                      <option value="">Sin perfil</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              )}

              {/* Estado - SOLO EN EDITAR */}
              {accion === 2 && (
                <div className="col-md-6">
                  <Form.Group>
                    <Form.Label className="fw-bold">Estado</Form.Label>
                    <Form.Select
                      name="state_id"
                      value={formData.state_id || ""}
                      onChange={handleFormChange}
                      disabled={processing}
                    >
                      <option value="">Seleccione</option>
                      {states.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </div>
              )}
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

export default UserPage;
