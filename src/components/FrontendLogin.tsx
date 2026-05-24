import { Outlet, useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

const FrontendLogin = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  useEffect(() => {
    // Si está logueado, redirigir al Home
    if (auth && !auth.loading && auth.isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [auth, navigate]);

  // Loading state
  if (auth?.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default FrontendLogin;