/**
 * PROBLEMA DE ARQUITECTURA: DEPENDENCIA CÍCLICA (La otra mitad)
 * -------------------------------------------------------------
 * Aquí se cierra el ciclo. NominaService importa y utiliza EmpleadoService.
 * 
 * CONSECUENCIAS:
 * 1. Fragilidad: Un cambio en la API de EmpleadoService afecta a NominaService, 
 *    que a su vez podría causar efectos secundarios en EmpleadoService.
 * 2. Pruebas difíciles: Para probar NominaService, NECESITAS una versión funcionando de EmpleadoService.
 *    No puedes mockearlo fácilmente si están fuertemente acoplados por 'new' o importaciones estáticas circulares.
 * 3. Tiempos de compilación: En proyectos grandes, estos ciclos impiden la compilación incremental efectiva.
 */

import { EmpleadoService } from './EmpleadoService';

export class NominaService {
  // B -> A: El ciclo se cierra aquí.
  private empleadoService: EmpleadoService;

  constructor() {
    // En un entorno real, esto causaría un StackOverflowError si ambos hacen 'new' en el constructor.
    // Incluso si se inyecta, la dependencia de TIPO (import) ya crea el ciclo a nivel de arquitectura/compilación.
    this.empleadoService = new EmpleadoService();
  }

  public obtenerSalarioBase(empleadoId: string): number {
    // Nomina necesita datos del empleado para calcular impuestos/retenciones
    const datos = this.empleadoService.obtenerDatosEmpleado(empleadoId);
    if (datos) {
      return 2000;
    }
    return 0;
  }
}
