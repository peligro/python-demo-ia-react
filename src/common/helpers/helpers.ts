export const normalize = (str: string): string => {
  return str.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
};
export const getDiasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const getMeses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];