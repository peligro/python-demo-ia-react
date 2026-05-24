
export interface AlertCustomInterface
{
    estado: boolean;
    titulo: string;
    detalle: string;
    onClose?:()=>void;
    onConfirm?:()=>void;
    headerBg: string;
    esConfirm?:boolean;
    confirmText?: string;
    cancelText?: string;
}