
import { useEffect, useState } from "react"; 
import { Button, Modal } from "react-bootstrap";
import type { AlertCustomInterface } from "../interfaces/AlertCustomInterface";

// Colores base por tipo de alerta (si no se define headerBg)
const COLOR_POR_TIPO: Record<string, string> = {
  'bg-success': '#10b981',
  'bg-danger': '#ef4444',
  'bg-warning': '#f59e0b',
  'bg-info': '#3b82f6',
  'bg-primary': '#2563eb',
};

const AlertCustom = (datos: AlertCustomInterface) => {
  const [show, setShow] = useState(datos.estado);

  useEffect(() => {
    setShow(datos.estado);
  }, [datos.estado]);

  const handleClose = () => {
    setShow(false);
    datos.onClose?.();
  };

  const handleConfirm = () => {
    setShow(false);
    datos.onConfirm?.();
  };

  // Determinar color de fondo y color de texto
  const headerClass = datos.headerBg || 'bg-primary';
  const bgColor = COLOR_POR_TIPO[headerClass] || '#2563eb';
  const confirmText = datos.confirmText || 'Aceptar';
  const cancelText = datos.cancelText || 'Cancelar';

  // Elegir icono según el tipo de alerta
  const getIcon = () => {
    // Primero verificar si es confirmación de logout
    if (datos.esConfirm && headerClass.includes('warning')) {
      return 'fas fa-sign-out-alt'; // Ícono de logout
    }
    
    // Luego los íconos por tipo de alerta
    if (headerClass.includes('success')) return 'fas fa-check-circle';
    if (headerClass.includes('danger')) return 'fas fa-exclamation-triangle';
    if (headerClass.includes('warning')) return 'fas fa-exclamation-circle';
    if (headerClass.includes('info')) return 'fas fa-info-circle';
    return 'fas fa-bell';
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
       
      backdrop="static"
      keyboard={false}
      className="fade"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      <Modal.Header
        closeButton
        className="border-0"
        style={{
          backgroundColor: bgColor,
          color: 'white',
          borderRadius: '12px 12px 0 0',
          padding: '1.25rem 1.5rem',
          borderBottom: 'none',
        }}
      >
        <div className="d-flex align-items-center">
          <i className={`${getIcon()} me-2`} style={{ fontSize: '1.4rem', opacity: 0.9 }}></i>
          <Modal.Title className="h5 mb-0">{datos.titulo}</Modal.Title>
        </div>
      </Modal.Header>

      <Modal.Body className="text-center py-4 px-4">
        <div className="fs-5 text-muted" style={{ lineHeight: 1.6, color: '#334155' }}>
          {datos.detalle}
        </div>
      </Modal.Body>

      <Modal.Footer
        className="border-0 justify-content-center"
        style={{ padding: '0 1.5rem 1.5rem', gap: '0.75rem' }}
      >
        {datos.esConfirm && (
          <Button
            variant="outline-secondary"
            onClick={handleClose}
            className="px-4 py-2 fw-medium"
            style={{
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              color: '#475569',
              backgroundColor: '#f8fafc',
            }}
            title={cancelText}
          >
            <i className="fas fa-times me-1"></i> {cancelText}
          </Button>
        )}
        <Button
          onClick={datos.esConfirm ? handleConfirm : handleClose}
          className="px-4 py-2 fw-medium text-white"
          style={{
            backgroundColor: bgColor,
            borderColor: bgColor,
            borderRadius: '8px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = darkenColor(bgColor, 15))}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = bgColor)}
          title={confirmText}
        >
          <i className={`${getIcon()} me-1`}></i> {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Función auxiliar para oscurecer un color hex (usado en hover)
const darkenColor = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = ((num >> 8) & 0x00ff) - amt;
  const B = (num & 0x0000ff) - amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1).toUpperCase()}`;
};

export default AlertCustom;