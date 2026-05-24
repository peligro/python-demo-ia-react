import { Outlet } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { getDiasSemana, getMeses } from "../common/helpers/helpers";
import ChatBot from "../modules/domitila/component/Chatbot";



const Frontend = () => {
  const auth = useContext(AuthContext);  // ✅ Acceder al contexto
  
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [fechaTexto, setFechaTexto] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Validar autenticación
  useEffect(() => {
    if (!auth || auth.loading) return;
    if (!auth.isAuthenticated) {
      window.location.href = "/login";
    }
  }, [auth]);

  // Reloj en tiempo real
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
      const now = new Date();
      setFechaTexto(`${getDiasSemana[now.getDay()]} ${now.getDate()} de ${getMeses[now.getMonth()]} de ${now.getFullYear()}`);
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    if (auth?.logout) {
      await auth.logout();
    } else {
      window.location.href = "/login";
    }
  };

  // Loading state
  if (auth?.loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Cargando Tamila...</span>
          </div>
          <p className="text-muted mb-0">Validando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container d-flex flex-column" style={{ minHeight: "100vh" }}>
      <Header
        time={time}
        fechaTexto={fechaTexto}
        setShowMobileSidebar={setShowMobileSidebar}
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        onConfirmLogout={handleConfirmLogout}
        user={auth?.user || null}
      />

      <div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          showMobileSidebar={showMobileSidebar}
          setShowMobileSidebar={setShowMobileSidebar}
        />

        <main className="main-content flex-grow-1 p-3 p-md-4 bg-mist-50" style={{ minWidth: 0 }}>
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
      </div>
      <ChatBot />
      <Footer />
    </div>
  );
};

export default Frontend;