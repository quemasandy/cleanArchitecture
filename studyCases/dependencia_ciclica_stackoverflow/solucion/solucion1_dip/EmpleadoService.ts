/**
 * SOLUCIÓN 1: INVERSIÓN DE DEPENDENCIA (DIP) - Lado Implementador
 * ---------------------------------------------------------------
 * EmpleadoService ahora IMPLEMENTA la interfaz definida por NominaService.
 * 
 * ANÁLISIS DEL GRAFO DE DEPENDENCIAS (DAG):
 * - EmpleadoService -> NominaService (Sigue dependiendo, usa NominaService)
 * - EmpleadoService -> IEmpleadoInfo (Que vive en NominaService)
 * 
 * NominaService -> NADA externo (Solo depende de su propia interfaz IEmpleadoInfo)
 * 
 * FLUJO:
 * EmpleadoService --> [NominaService Package]
 * 
 * ¡EL CICLO ES ACÍCLICO! La flecha de regreso (Nomina -> Empleado) ha desaparecido.
 */

import { NominaService, IEmpleadoInfo } from './NominaService';

// Implementamos la interfaz requerida por NominaService
export class EmpleadoService implements IEmpleadoInfo {
  private nominaService: NominaService;

  constructor() {
    // Para que esto funcione en runtime, alguien debe "cablear" las instancias.
    // Aquí pasamos 'this', ya que EmpleadoService cumple con IEmpleadoInfo.
    this.nominaService = new NominaService(this);
  }

  // Implementación de la interfaz
  public obtenerDatosEmpleado(id: string): string {
    return `Datos del empleado ${id} (Desde Implementación DIP)`;
  }

  public calcularSalarioTotal(id: string): number {
    return this.nominaService.obtenerSalarioBase(id) + 1000;
  }
}
