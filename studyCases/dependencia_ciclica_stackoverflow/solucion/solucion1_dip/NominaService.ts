/**
 * SOLUCIÓN 1: INVERSIÓN DE DEPENDENCIA (DIP)
 * ------------------------------------------
 * PARA ROMPER EL CICLO: NominaService -> EmpleadoService
 * 
 * ESTRATEGIA:
 * 1. NominaService define una INTERFAZ (IEmpleadoInfo) con lo que necesita.
 * 2. NominaService depende de esta interfaz, NO de la implementación concreta (EmpleadoService).
 * 3. La interfaz pertenece a la capa/modulo de NominaService (Consumer Interface).
 * 
 * RESULTADO:
 * - NominaService ya no tiene "imports" hacia EmpleadoService.
 * - La flecha de dependencia ahora apunta hacia adentro de NominaService (o a la abstracción).
 * - El ciclo se ha roto.
 */

// Interfaz definida por el consumidor (Nomina).
// Esto invierte la dependencia: Quien implemente esto dependerá de NominaService (o su definición), no al revés.
export interface IEmpleadoInfo {
  obtenerDatosEmpleado(id: string): string;
}

export class NominaService {
  // Dependemos de la ABSTRACCIÓN, no de la concreción 'EmpleadoService'.
  private empleadoInfo: IEmpleadoInfo;

  constructor(empleadoInfo: IEmpleadoInfo) {
    // Inyección de dependencia: La implementación real se pasa desde fuera (Main/Composition Root)
    this.empleadoInfo = empleadoInfo;
  }

  public obtenerSalarioBase(empleadoId: string): number {
    // Usamos la interfaz
    const datos = this.empleadoInfo.obtenerDatosEmpleado(empleadoId);
    if (datos) {
      return 2000;
    }
    return 0;
  }
}
