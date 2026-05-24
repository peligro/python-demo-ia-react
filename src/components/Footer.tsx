const Footer = () => {
  return (
    <>
    <footer className="bg-dark text-white py-3 border-top border-sidebar-500" style={{ flexShrink: 0 }}>
                <div className="container-fluid">
                    <div className="row align-items-center">
                        <div className="col-md-6 text-center text-md-start">
                            <small>
                                <i className="fas fa-heart text-danger me-1"></i>
                                Tamila © {new Date().getFullYear()} - Tu asistente de gestión
                            </small>
                        </div>
                        <div className="col-md-6 text-center text-md-end mt-2 mt-md-0">
                            <small className="text-white-50">
                                <i className="fas fa-shield-alt me-1"></i>
                                v1.0.0
                            </small>
                        </div>
                    </div>
                </div>
            </footer>
    </>
  )
}

export default Footer