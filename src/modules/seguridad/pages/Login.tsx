import { useState, useEffect, useRef, useContext } from "react";
import { Form, Button, Card, Row, Col, Container } from "react-bootstrap";
import { AuthContext } from "../../../context/AuthContext";
import { loginApi } from "../services/authService";

const Login = () => {
  const auth = useContext(AuthContext);
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const emailRef = useRef<HTMLInputElement>(null);

  // Foco automático al cargar
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
    setErrors({});
  }, []);

  // Validar email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validaciones en tiempo real
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "email":
        if (!value.trim()) return "El correo es obligatorio";
        if (!isValidEmail(value)) return "El correo no tiene un formato válido";
        return "";
      case "password":
        if (!value) return "La contraseña es obligatoria";
        if (value.length < 6) return "La contraseña debe tener al menos 6 caracteres";
        return "";
      default:
        return "";
    }
  };

  // Handle change con validación
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setLoginForm((prev) => ({ ...prev, [name]: fieldValue }));

    // Validar campo y actualizar errores
    const error = validateField(name, type === "checkbox" ? "" : value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidated(true);

    // Validar todos los campos
    const newErrors: { [key: string]: string } = {};

    const emailError = validateField("email", loginForm.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validateField("password", loginForm.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await loginApi({
        email: loginForm.email,
        password: loginForm.password,
      });

      // Actualizar AuthContext
      if (auth) {
        // El login ya actualiza el contexto internamente
      }

      // Redirigir al home
      window.location.href = "/";
    } catch (error: any) {
      const message = error.response?.data?.message || "Credenciales incorrectas";
      setErrors({
        email: message,
        password: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Container fluid className="vh-100 p-0 m-0">
        <Row className="h-100 m-0">
          {/* ===== COLUMNA IZQUIERDA - IMAGEN/BRANDING ===== */}
          <Col
            md={5}
            className="d-none d-md-flex flex-column justify-content-between px-5 py-4"
            style={{
              background: "linear-gradient(135deg, var(--navbar-800), var(--sidebar-700))",
            }}
          >
            {/* Logo superior */}
            <div className="d-flex align-items-center">
              <img
                src="https://www.cesarcancino.com/wp-content/themes/cesarcancino/assets/img/logo.jpg"
                alt="Tamila"
                height="50"
                className="rounded"
              />
              <span className="text-white fw-bold fs-4 ms-2">TAMILA</span>
            </div>

            {/* Imagen central */}
            <div className="d-flex justify-content-center align-items-center flex-grow-1">
              <div className="text-center">
                <img
                  src="https://dummyimage.com/400x300/1e40af/ffffff.jpg&text=Tamila+SAAS"
                  alt="Ilustración"
                  className="img-fluid rounded shadow-lg"
                  style={{ maxWidth: "350px" }}
                />
              </div>
            </div>

            {/* Footer izquierdo */}
            <div className="text-white mt-auto">
              <h4 className="fw-bold mb-2">Gestiona tu negocio con inteligencia</h4>
              <p className="text-white-50 mb-0">
                Agenda, clientes, pagos y más en una sola plataforma.
              </p>
            </div>
          </Col>

          {/* ===== COLUMNA DERECHA - FORMULARIO ===== */}
          <Col
            md={7}
            className="d-flex align-items-center justify-content-center bg-mist-50"
          >
            <Card
              className="p-4 p-md-5 border-0 shadow"
              style={{
                maxWidth: "500px",
                width: "100%",
                borderRadius: "16px",
              }}
            >
              {/* Título */}
              <div className="text-center mb-4">
                <h2 className="fw-bold text-dark">Te damos la bienvenida! 👋</h2>
                <p className="text-muted mb-0">Inicia sesión para continuar</p>
              </div>

              {/* ===== FORMULARIO LOGIN ===== */}
              <Form noValidate validated={validated} onSubmit={handleLoginSubmit}>
                {/* Correo Electrónico */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium text-dark">
                    Correo electrónico
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="tu@email.com"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    ref={emailRef}
                    isInvalid={!!errors.email}
                    isValid={validated && !errors.email && loginForm.email !== ""}
                    className="py-2"
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Contraseña */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium text-dark">
                    Contraseña
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      isInvalid={!!errors.password}
                      isValid={validated && !errors.password && loginForm.password !== ""}
                      className="py-2 pe-5"
                      disabled={loading}
                    />
                    <Button
                      variant="link"
                      className="position-absolute top-50 end-0 translate-middle-y text-muted p-0"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      disabled={loading}
                      style={{ zIndex: 10 }}
                    >
                      <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} me-2`}></i>
                    </Button>
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
 

                {/* Botón Login */}
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-2 fw-medium rounded-pill bg-sidebar-700 border-0"
                  disabled={loading}
                  style={{
                    background: "linear-gradient(90deg, var(--sidebar-700), var(--sidebar-600))",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e: any) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 8px 20px rgba(37, 99, 235, 0.4)";
                  }}
                  onMouseLeave={(e: any) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Cargando...
                    </>
                  ) : (
                    <>
                      Iniciar sesión <i className="fas fa-arrow-right ms-2"></i>
                    </>
                  )}
                </Button>
              </Form>

              {/* Footer del card */}
              <div className="text-center mt-4 pt-3 border-top">
                <small className="text-muted">
                  <i className="fas fa-shield-alt me-1"></i>
                  Tu información está protegida con encriptación de nivel empresarial
                </small>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Login;