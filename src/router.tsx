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
 




const router = createBrowserRouter([
    // 🔐 Rutas de autenticación (públicas)
    {
        element: <FrontendLogin />,
        hydrateFallbackElement: <div style={{ visibility: 'hidden' }}>Loading...</div>,
        children: [
            { path: '/login', element: <Login /> },
            { path: '/reset-password/:token', element: <ResetPassword /> },
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
        hydrateFallbackElement: <div style={{ visibility: 'hidden' }}>Loading...</div>,
        children: [
            // 👉 Home - Solo requiere tener acceso al módulo "Home"
            { path: '/', index: true, element: <Home /> },
            {
                path: '/settings',
                element: (
                    <ProtectedRoute>
                        <AdminHome />
                    </ProtectedRoute>
                )
            },
            {
                path: '/help',
                element: (
                    <ProtectedRoute>
                        <Help />
                    </ProtectedRoute>
                ),
                errorElement: <ErrorPages />
            },
            // 👉 Página de acceso denegado
            { path: '/sin-acceso', element: <NoAccess /> },

            // 👉 404 dentro de rutas protegidas
            { path: "*", element: <Error404 /> },
        ],
    },
]);

export default router;