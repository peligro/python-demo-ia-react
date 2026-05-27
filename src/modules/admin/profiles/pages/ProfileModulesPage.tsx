import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Modal,
  Form,
  Button,
  Table,
  Card,
  Container,
  Row,
  Col,
  Badge,
  Alert,
} from "react-bootstrap";
import "react-bootstrap-typeahead/css/Typeahead.css";
import type {
  ModuleOption,
  ItemOption,
} from "../interfaces/ProfileInterface";
import type { AlertCustomInterface } from "../../../../common/interfaces/AlertCustomInterface";
import { profileService } from "../services/profileService";
import AlertCustom from "../../../../common/ui/AlertCustom";

interface ModuleWithItems extends ModuleOption {
  items: ItemOption[];
  item_ids: number[];
  total_items: number;
  isExpanded: boolean;
  isLoading: boolean;
}

const ProfileModulesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profileName, setProfileName] = useState("");
  const [modules, setModules] = useState<ModuleWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal de items
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleWithItems | null>(null);
  const [availableItems, setAvailableItems] = useState<ItemOption[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [savingItems, setSavingItems] = useState(false);

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

  // ✅ UN SOLO useEffect para cargar TODO
  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Cargar módulos del perfil
        const assigned = await profileService.getModules(+id);
        setProfileName(assigned.profile_name ?? 'Perfil');

        // 2. Cargar items para cada módulo en paralelo
        const modulesWithItems = await Promise.all(
          (assigned.modules ?? []).map(async (m) => {
            try {
              // ✅ El backend retorna array directo, no un objeto
              const itemsResp = await profileService.getModuleItems(+id, m.id);
              
              // ✅ Si es array, extraer IDs; si es objeto, usar properties
              const items = Array.isArray(itemsResp) 
                ? itemsResp 
                : (itemsResp.items ?? []);
              
              const itemIds = Array.isArray(itemsResp)
                ? itemsResp.map((item: ItemOption) => item.id)
                : (itemsResp.item_ids ?? []);
              
              return {
                ...m,
                items: items,
                item_ids: itemIds,
                total_items: items.length,
                isExpanded: false,
                isLoading: false,
              };
            } catch (error) {
              console.error(`Error cargando items del módulo ${m.id}:`, error);
              return {
                ...m,
                items: [],
                item_ids: [],
                total_items: 0,
                isExpanded: false,
                isLoading: false,
              };
            }
          })
        );

        // 3. Actualizar estado UNA VEZ con todos los datos
        setModules(modulesWithItems);
      } catch (error: any) {
        console.error("❌ Error en loadData:", error);
        showAlert("Error", "No se pudieron cargar los datos", "bg-danger");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const showAlert = (
    titulo: string,
    detalle: string,
    headerBg: string
  ) => {
    setAlertData({
      estado: true,
      titulo,
      detalle,
      headerBg,
      onClose: () => setAlertData((prev) => ({ ...prev, estado: false })),
    });
  };

  const toggleModule = (moduleId: number) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, isExpanded: !m.isExpanded } : m
      )
    );
  };

  const removeModule = async (moduleId: number, moduleName: string) => {
    setAlertData({
      estado: true,
      titulo: "¿Quitar módulo?",
      detalle: `¿Deseas remover "${moduleName}" del perfil?`,
      headerBg: "bg-warning",
      esConfirm: true,
      confirmText: "Sí, quitar",
      cancelText: "Cancelar",
      onClose: () => setAlertData((prev) => ({ ...prev, estado: false })),
      onConfirm: async () => {
        setAlertData((prev) => ({ ...prev, estado: false }));
        try {
          const currentModuleIds = modules.map((m) => m.id);
          const newModuleIds = currentModuleIds.filter((mid) => mid !== moduleId);

          await profileService.syncModules(+id!, newModuleIds);
          setModules((prev) => prev.filter((m) => m.id !== moduleId));
          showAlert("¡Actualizado!", `Módulo "${moduleName}" removido`, "bg-success");
        } catch (error: any) {
          const msg = error.response?.data?.detail || "Error al remover módulo";
          showAlert("❌ Error", msg, "bg-danger");
        }
      },
    });
  };

  const openItemsModal = async (module: ModuleWithItems) => {
    setSelectedModule(module);
    setSelectedItemIds([...(module.item_ids ?? [])]);
    setShowItemsModal(true);

    try {
      const allItems = await profileService.getAllItems();
      setAvailableItems(allItems ?? []);
    } catch (error) {
      console.error("Error cargando items disponibles:", error);
      showAlert("Error", "No se pudieron cargar los items", "bg-danger");
    }
  };

  const toggleItemSelection = (itemId: number) => {
    setSelectedItemIds((prev) => {
      const current = prev ?? [];
      return current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
    });
  };

  const saveModuleItems = async () => {
    if (!selectedModule || !id) return;

    setSavingItems(true);
    try {
      const currentIds = selectedModule.item_ids ?? [];
      const newIds = selectedItemIds ?? [];

      const toDetach = currentIds.filter((id) => !newIds.includes(id));
      const toAttach = newIds.filter((id) => !currentIds.includes(id));

      for (const itemId of toDetach) {
        await profileService.detachItem(+id, selectedModule.id, itemId);
      }

      for (const itemId of toAttach) {
        await profileService.attachItem(+id, selectedModule.id, itemId);
      }

      // Recargar items del módulo
      const response = await profileService.getModuleItems(+id, selectedModule.id);
      
      // ✅ Manejar ambos formatos de respuesta
      const items = Array.isArray(response) 
        ? response 
        : (response.items ?? []);
      
      const itemIds = Array.isArray(response)
        ? response.map((item: ItemOption) => item.id)
        : (response.item_ids ?? []);
      
      setModules((prev) =>
        prev.map((m) => {
          if (m.id === selectedModule.id) {
            return {
              ...m,
              items: items,
              item_ids: itemIds,
              total_items: items.length,
            };
          }
          return m;
        })
      );

      setShowItemsModal(false);
      showAlert("¡Guardado!", "Items actualizados", "bg-success");
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Error al guardar items";
      showAlert("❌ Error", msg, "bg-danger");
    } finally {
      setSavingItems(false);
    }
  };

  const getAvailableItemsForModule = () => {
    if (!selectedModule) return [];
    const moduleItemIds = selectedModule.item_ids ?? [];
    return (availableItems ?? []).filter(
      (item) => !moduleItemIds.includes(item.id)
    );
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
            <li className="breadcrumb-item active">
              Módulos: {profileName}
            </li>
          </ol>
        </nav>

        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-layer-group me-2"></i>
                Módulos para: {profileName}
              </h5>
              <Button
                variant="light"
                size="sm"
                onClick={() => navigate(`/settings/profiles/${id}/edit`)}
              >
                <i className="fas fa-edit me-2"></i>
                Volver a Editar
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {modules.length === 0 ? (
              <Alert variant="info" className="m-3">
                <i className="fas fa-info-circle me-2"></i>
                Este perfil no tiene módulos asignados.
                <Link to={`/settings/profiles/${id}/edit`} className="ms-1 fw-bold">
                  Asignar módulos aquí
                </Link>
              </Alert>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: "5%" }}></th>
                    <th style={{ width: "30%" }}>Módulo</th>
                    <th style={{ width: "45%" }}>Items asignados</th>
                    <th style={{ width: "20%" }} className="text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module) => {
                    const items = module.items ?? [];
                    const itemCount = items.length;
                    
                    return (
                      <React.Fragment key={module.id}>
                        <tr className="align-middle">
                          <td className="text-center">
                            <Button
                              variant="link"
                              size="sm"
                              className="text-decoration-none p-0"
                              onClick={() => toggleModule(module.id)}
                              disabled={module.isLoading}
                            >
                              {module.isExpanded ? (
                                <i className="fas fa-chevron-down text-primary"></i>
                              ) : (
                                <i className="fas fa-chevron-right text-muted"></i>
                              )}
                            </Button>
                          </td>
                          <td>
                            <span className="fw-semibold">{module.name}</span>
                            <div className="small text-muted">{module.slug}</div>
                          </td>
                          <td>
                            {itemCount > 0 ? (
                              <div className="d-flex flex-wrap gap-1">
                                {items.slice(0, 3).map((item) => (
                                  <Badge key={item.id} bg="success" className="py-1">
                                    {item.name}
                                  </Badge>
                                ))}
                                {itemCount > 3 && (
                                  <Badge bg="secondary" className="py-1">
                                    +{itemCount - 3} más
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted small">Sin items</span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex justify-content-center gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => openItemsModal(module)}
                                title="Gestionar items"
                              >
                                <i className="fas fa-list-check"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => removeModule(module.id, module.name)}
                                title="Quitar módulo"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>

                        {module.isExpanded && (
                          <tr>
                            <td colSpan={4} className="p-0">
                              <Card className="m-2 border-0 shadow-sm">
                                <Card.Body className="bg-light">
                                  <h6 className="fw-semibold mb-3">
                                    <i className="fas fa-cube me-2 text-primary"></i>
                                    Items de: {module.name}
                                  </h6>
                                  {itemCount > 0 ? (
                                    <div className="d-flex flex-wrap gap-2">
                                      {items.map((item) => (
                                        <Badge
                                          key={item.id}
                                          bg="light"
                                          text="dark"
                                          className="d-flex align-items-center gap-2 py-2 px-3 border"
                                        >
                                          <i className="fas fa-check-circle text-success"></i>
                                          <span>{item.name}</span>
                                          <small className="text-muted">
                                            ({item.code})
                                          </small>
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <Alert variant="secondary" className="mb-0 small">
                                      <i className="fas fa-info-circle me-1"></i>
                                      No hay items asignados. Haz clic en "Gestionar items" para agregar.
                                    </Alert>
                                  )}
                                </Card.Body>
                              </Card>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Modal para gestionar items */}
      <Modal
        show={showItemsModal}
        onHide={() => !savingItems && setShowItemsModal(false)}
        size="xl"
        scrollable
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-list-check me-2"></i>
            Gestionar items: {selectedModule?.name}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-light">
          <div className="mb-4">
            <Form.Label className="fw-bold d-block mb-2">
              Items asignados ({(selectedItemIds ?? []).length})
            </Form.Label>
            {(selectedItemIds ?? []).length === 0 ? (
              <Alert variant="info" className="mb-0 small">
                <i className="fas fa-info-circle me-1"></i>
                No hay items seleccionados
              </Alert>
            ) : (
              <Row className="g-2">
                {(selectedItemIds ?? []).map((itemId) => {
                  const item = [
                    ...(selectedModule?.items ?? []),
                    ...(availableItems ?? []),
                  ].find((i) => i?.id === itemId);
                  return item ? (
                    <Col key={itemId} xs={12} sm={6} md={4}>
                      <Badge
                        bg="primary"
                        className="w-100 d-flex align-items-center justify-content-between py-2 px-3"
                        style={{ fontSize: "0.9rem" }}
                      >
                        <span className="text-truncate me-2" title={item.name}>
                          {item.name}
                        </span>
                        <button
                          type="button"
                          className="btn-close btn-close-white btn-sm p-0"
                          style={{ fontSize: "0.6rem", flexShrink: 0 }}
                          onClick={() => toggleItemSelection(itemId)}
                          aria-label={`Remover ${item.name}`}
                        />
                      </Badge>
                    </Col>
                  ) : null;
                })}
              </Row>
            )}
          </div>

          <div>
            <Form.Label className="fw-bold d-block mb-2">
              Items disponibles ({getAvailableItemsForModule().length})
            </Form.Label>
            {getAvailableItemsForModule().length === 0 ? (
              <Alert variant="success" className="mb-0 small">
                <i className="fas fa-check-circle me-1"></i>
                ¡Todos los items están asignados!
              </Alert>
            ) : (
              <div
                className="border rounded p-3 bg-white"
                style={{ maxHeight: "300px", overflowY: "auto" }}
              >
                <Row className="g-2">
                  {getAvailableItemsForModule().map((item) => (
                    <Col key={item.id} xs={12} sm={6} md={4}>
                      <Form.Check
                        type="checkbox"
                        id={`item-${item.id}`}
                        label={
                          <span
                            className="small"
                            title={item.description || item.name}
                          >
                            <strong className="d-block text-truncate">
                              {item.name}
                            </strong>
                            <small className="text-muted d-block text-truncate">
                              {item.code}
                            </small>
                          </span>
                        }
                        checked={(selectedItemIds ?? []).includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="mt-1"
                      />
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer className="bg-white">
          <Button
            variant="secondary"
            onClick={() => setShowItemsModal(false)}
            disabled={savingItems}
          >
            <i className="fas fa-times me-2"></i>Cancelar
          </Button>
          <Button
            variant="success"
            onClick={saveModuleItems}
            disabled={savingItems}
          >
            {savingItems ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>Guardar cambios
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProfileModulesPage;