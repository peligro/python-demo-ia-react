import type { PaginacionCustomProps } from "../interfaces/PaginacionInfo";

const PaginacionCustom: React.FC<PaginacionCustomProps> = ({ datos, onPageChange }) => {
    const { current_page, last_page } = datos;

    // Si solo hay 1 página, no mostrar paginación
    if (last_page <= 1) return null;

    // Generar array de páginas a mostrar (con lógica de ellipsis)
    const getPageNumbers = (): (number | string)[] => {
        const pages: (number | string)[] = [];
        const delta = 2; // Cuántas páginas mostrar a cada lado de la actual
        const range: number[] = [];

        // Rango de páginas cercanas a la actual
        for (let i = Math.max(2, current_page - delta); i <= Math.min(last_page - 1, current_page + delta); i++) {
            range.push(i);
        }

        // Primera página
        if (current_page - delta > 2) {
            pages.push(1, '...');
        } else {
            pages.push(1);
        }

        // Páginas del rango
        range.forEach(page => pages.push(page));

        // Última página
        if (current_page + delta < last_page - 1) {
            pages.push('...', last_page);
        } else {
            if (!pages.includes(last_page)) {
                pages.push(last_page);
            }
        }

        return pages;
    };

    return (
        <nav aria-label="Paginación">
            <ul className="pagination pagination-warning mb-0">
                {/* First */}
                <li className={`page-item ${current_page === 1 ? 'disabled' : ''}`}>
                    <button
                        className="page-link"
                        onClick={() => onPageChange(1)}
                        disabled={current_page === 1}
                        aria-label="Primera página"
                        title="Primera página"
                    >
                        <i className="fas fa-angle-double-left"></i>
                    </button>
                </li>

                {/* Prev */}
                <li className={`page-item ${current_page === 1 ? 'disabled' : ''}`}>
                    <button
                        className="page-link"
                        onClick={() => onPageChange(current_page - 1)}
                        disabled={current_page === 1}
                        aria-label="Página anterior"
                        title="Anterior"
                    >
                        <i className="fas fa-angle-left"></i>
                    </button>
                </li>

                {/* Números de página */}
                {getPageNumbers().map((page, index) => (
                    typeof page === 'number' ? (
                        <li
                            key={index}
                            className={`page-item ${page === current_page ? 'active' : ''}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => onPageChange(page)}
                                aria-current={page === current_page ? 'page' : undefined}
                                aria-label={`Página ${page}`}
                            >
                                {page}
                            </button>
                        </li>
                    ) : (
                        <li key={index} className="page-item disabled">
                            <span className="page-link">{page}</span>
                        </li>
                    )
                ))}

                {/* Next */}
                <li className={`page-item ${current_page === last_page ? 'disabled' : ''}`}>
                    <button
                        className="page-link"
                        onClick={() => onPageChange(current_page + 1)}
                        disabled={current_page === last_page}
                        aria-label="Página siguiente"
                        title="Siguiente"
                    >
                        <i className="fas fa-angle-right"></i>
                    </button>
                </li>

                {/* Last */}
                <li className={`page-item ${current_page === last_page ? 'disabled' : ''}`}>
                    <button
                        className="page-link"
                        onClick={() => onPageChange(last_page)}
                        disabled={current_page === last_page}
                        aria-label="Última página"
                        title="Última página"
                    >
                        <i className="fas fa-angle-double-right"></i>
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default PaginacionCustom;