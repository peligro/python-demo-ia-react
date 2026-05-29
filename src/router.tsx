import { createBrowserRouter, Navigate } from "react-router-dom";
// 👇 Componentes de protección

import ProtectedRoute from "./components/ProtectedRoute";
import FrontendLogin from "./components/FrontendLogin";
import Login from "./modules/seguridad/pages/Login";
import ResetPassword from "./modules/seguridad/pages/ResetPassword";
import Frontend from "./components/Frontend";
import Home from "./modules/home/pages/Home";
import AdminHome from "./modules/admin/home/AdminHome";
import ErrorPages from "./modules/error/pages/ErrorPages";
import NoAccess from "./modules/no_access/NoAccess";
import Error404 from "./modules/error/pages/Error404";
import Help from "./modules/help/pages/Help";
import AppMenuList from "./modules/admin/app_menu/pages/AppMenuList";
import UserPage from "./modules/admin/users/pages/UserPage";
import ProfilePage from "./modules/admin/profiles/pages/ProfilePage";
import ProfileEditPage from "./modules/admin/profiles/pages/ProfileEditPage";
import ProfileModulesPage from "./modules/admin/profiles/pages/ProfileModulesPage";
import ItemPage from "./modules/admin/items/pages/ItemPage";
import ModulePage from "./modules/admin/modules/pages/ModulePage";
import HomeMenuPage from "./modules/admin/home_menu/pages/HomeMenuPage";
import AgenteKBPage from "./modules/portfolio/agente_knowledge_base/pages/AgenteKBPage";

const router = createBrowserRouter([
  // 🔐 Rutas de autenticación (públicas)
  {
    element: <FrontendLogin />,
    hydrateFallbackElement: (
      <div style={{ visibility: "hidden" }}>Loading...</div>
    ),
    children: [
      { path: "/login", element: <Login /> },
      { path: "/reset-password/:token", element: <ResetPassword /> },
      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },

  // 🔐 Rutas protegidas (requieren autenticación + permisos)
  {
    element: (
      <ProtectedRoute>
        <Frontend />
      </ProtectedRoute>
    ),
    hydrateFallbackElement: (
      <div style={{ visibility: "hidden" }}>Loading...</div>
    ),
    children: [
      // 👉 Home - Solo requiere tener acceso al módulo "Home"
      { path: "/", index: true, element: <Home /> },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <AdminHome />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/app-menu",
        element: (
          <ProtectedRoute>
            <AppMenuList />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/users",
        element: (
          <ProtectedRoute>
            <UserPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/profiles",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/profiles/:id/edit",
        element: (
          <ProtectedRoute>
            <ProfileEditPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/profiles/:id/modules",
        element: (
          <ProtectedRoute>
            <ProfileModulesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/items",
        element: (
          <ProtectedRoute>
            <ItemPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/modules",
        element: (
          <ProtectedRoute>
            <ModulePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings/home-menu",
        element: (
          <ProtectedRoute>
            <HomeMenuPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/portfolio/agente-kb",
        element: (
          <ProtectedRoute>
            <AgenteKBPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/help",
        element: (
          <ProtectedRoute>
            <Help />
          </ProtectedRoute>
        ),
        errorElement: <ErrorPages />,
      },
      // 👉 Página de acceso denegado
      { path: "/sin-acceso", element: <NoAccess /> },

      // 👉 404 dentro de rutas protegidas
      { path: "*", element: <Error404 /> },
    ],
  },
]);

export default router;
