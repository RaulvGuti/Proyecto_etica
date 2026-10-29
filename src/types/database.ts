export type RolUsuario = 'usuario' | 'moderador' | 'admin';
export type EstadoPublicacion = 'visible' | 'oculto' | 'eliminado';
export type EstadoReporte = 'pendiente' | 'revisado' | 'descartado';

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Ciudad {
  id: number;
  nombre: string;
  departamento: string;
}

export interface TipoOrganizacion {
  id: number;
  nombre: string;
}

export interface Perfil {
  id: string;
  alias: string;
  rol: RolUsuario;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Organizacion {
  id: number;
  nombre: string;
  ciudad_id: number;
  tipo_id: number;
  telefono: string | null;
  sitio_web: string | null;
  nota: string | null;
  verificado: boolean;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
  eliminado_en: string | null;
}

export interface OrganizacionConDetalles extends Organizacion {
  ciudad?: Ciudad | null;
  tipo?: TipoOrganizacion | null;
}

export interface Publicacion {
  id: number;
  autor_id: string | null;
  categoria_id: number;
  alias_mostrado: string;
  texto: string;
  anonimo: boolean;
  estado: EstadoPublicacion;
  creado_en: string;
  actualizado_en: string;
  eliminado_en: string | null;
}

export interface PublicacionConCategoria extends Publicacion {
  categoria?: Categoria | null;
}

export interface Reporte {
  id: number;
  publicacion_id: number;
  reportado_por: string | null;
  motivo: string;
  estado: EstadoReporte;
  creado_en: string;
}
