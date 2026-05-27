import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Form,
  Button,
  Card,
  Container,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import type { ProfileItem, ModuleOption } from "../interfaces/ProfileInterface";
import type { AlertCustomInterface } from "../../../../common/interfaces/AlertCustomInterface";
import { profileService } from "../services/profileService";
import AlertCustom from "../../../../common/ui/AlertCustom";

const ProfileEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estado del formulario
  const [_, setProfile] = useState<ProfileItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const [availableModules, setAvailableModules] = useState<ModuleOption[]>([]);

  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validated, setValidated] = useState(false);
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

  // Cargar datos
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Cargar perfil
        const profileData = await profileService.show(+id);
        setProfile(profileData);
        setName(profileData.name);
        setDescription(profileData.description);

        // 2. Cargar módulos disponibles
        const modules = await profileService.getAllModules();
        setAvailableModules(modules);

        // 3. Cargar módulos asignados
        const assigned = await profileService.getModules(+id);
        setSelectedModuleIds(assigned.module_ids || []);
      } catch (error: any) {
        console.error("Error cargando datos:", error);
        showAlert(
          "Error",
          "No se pudieron cargar los datos del perfil",
          "bg-danger",
        );
        setTimeout(() => navigate("/settings/profiles"), 1000);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const showAlert = (titulo: string, detalle: string, headerBg: string) => {
    setAlertData({
      estado: true,
      titulo,
      detalle,
      headerBg,
      onClose: () => setAlertData((prev) => ({ ...prev, estado: false })),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);

    if (!name.trim() || !description.trim()) {
      showAlert(
        "⚠️ Validación",
        "Todos los campos son obligatorios",
        "bg-warning",
      );
      return;
    }

    if (!id) return;

    setSaving(true);
    try {
      // 1. Actualizar perfil
      await profileService.update(+id, { name, description });

      // 2. Sincronizar módulos (solo si hay cambios)
      console.log("📦 selectedModuleIds:", selectedModuleIds); // ← Debug
      await profileService.syncModules(+id, selectedModuleIds);

      showAlert(
        "¡Actualizado!",
        "Perfil actualizado exitosamente",
        "bg-success",
      );
      setTimeout(() => navigate(`/settings/profiles/${id}/edit`), 1500);
    } catch (error: any) {
      // ✅ Debug completo del error
      console.error("❌ Error en handleSubmit:", error);
      console.error("📦 Response:", error.response);
      console.error("📦 Data:", error.response?.data);

      const msg =
        error.response?.data?.detail ||
        error.response?.data?.mensaje ||
        "Error al actualizar";
      showAlert("❌ Error", msg, "bg-danger");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </Container>
    );
  }

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

      <Container fluid className="py-4">
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
            <li className="breadcrumb-item">
              <Link to="/settings/profiles">Perfiles</Link>
            </li>
            <li className="breadcrumb-item active">Editar: {name}</li>
          </ol>
        </nav>

        {/* Formulario de edición - Full width */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="fas fa-edit me-2"></i>
              Editar Perfil
            </h5>
          </Card.Header>
          <Card.Body>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Nombre *</Form.Label>
                    <Form.Control
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      isInvalid={validated && !name.trim()}
                      placeholder="Ej: Administrador"
                      disabled={saving}
                    />
                    <Form.Control.Feedback type="invalid">
                      El nombre es obligatorio
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Descripción *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      isInvalid={validated && !description.trim()}
                      placeholder="Describe los permisos y alcance de este perfil..."
                      disabled={saving}
                    />
                    <Form.Control.Feedback type="invalid">
                      La descripción es obligatoria
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/settings/profiles")}
                  disabled={saving}
                >
                  <i className="fas fa-times me-2"></i>Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>Actualizar
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Select de módulos - Debajo del formulario */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">
              <i className="fas fa-layer-group me-2"></i>
              Módulos Asignados
            </h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Seleccionar módulos
                  </Form.Label>

                  <Typeahead
                    id="modules-typeahead"
                    labelKey="name"
                    multiple
                    options={availableModules}
                    selected={availableModules.filter(
                      (m) => selectedModuleIds?.includes(m.id) ?? false,
                    )}
                    onChange={(selected: any) => {
                      const modules = selected as ModuleOption[];
                      setSelectedModuleIds(modules.map((m) => m.id));
                    }}
                    placeholder="Buscar y seleccionar módulos..."
                    disabled={saving}
                    renderMenuItemChildren={(option: any) => {
                      const mod = option as ModuleOption;
                      return (
                        <div>
                          <strong>{mod.name}</strong>
                          <div className="small text-muted">{mod.slug}</div>
                        </div>
                      );
                    }}
                  />

                  <Form.Text className="text-muted mt-2 d-block">
                    {selectedModuleIds.length} módulo(s) seleccionado(s)
                  </Form.Text>
                </Form.Group>

                {selectedModuleIds.length > 0 && (
                  <div className="mt-3">
                    <h6 className="fw-bold">Módulos seleccionados:</h6>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {selectedModuleIds.map((moduleId) => {
                        const mod = availableModules.find(
                          (m) => m.id === moduleId,
                        );
                        return mod ? (
                          <span
                            key={moduleId}
                            className="badge bg-primary py-2 px-3"
                          >
                            {mod.name}
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-2"
                              style={{ fontSize: "0.6rem" }}
                              onClick={() => {
                                setSelectedModuleIds(
                                  selectedModuleIds.filter(
                                    (id) => id !== moduleId,
                                  ),
                                );
                              }}
                            ></button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </Col>

              <Col md={4}>
                <Alert variant="info" className="h-100 mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Para gestionar los items/permisos de cada módulo, ve a la
                  página de{" "}
                  <Link to={`/settings/profiles/${id}/modules`}>
                    Módulos del Perfil
                  </Link>
                </Alert>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default ProfileEditPage;
