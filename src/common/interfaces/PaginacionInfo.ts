export interface PaginationInfo {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
}
export interface PaginacionCustomProps {
    datos: PaginationInfo;
    onPageChange: (page: number) => void;
}
