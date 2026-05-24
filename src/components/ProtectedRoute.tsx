import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const auth = useContext(AuthContext);
  const location = useLocation();

  // 🔹 Loading state
  if (auth?.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Validando sesión...</span>
          </div>
          <p className="text-muted mb-0">Validando sesión...</p>
        </div>
      </div>
    );
  }

  // 🔹 No autenticado → Redirect a login
  if (!auth?.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ✅ Todo OK: renderizar contenido protegido
  return <>{children}</>;
};

export default ProtectedRoute;