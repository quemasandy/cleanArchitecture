/**
 * SOLUCIÓN 2: LADO NOMINA
 * -----------------------
 * NominaService necesita datos del empleado.
 * EN LUGAR DE importarlos de EmpleadoService (lo que causaría el ciclo),
 * los importa del NUVEO COMPONENTE 'ComponenteCompartido'.
 * 
 * DEPENDENCIAS:
 * NominaService -> ComponenteCompartido
 * 
 * (No hay flecha hacia EmpleadoService)
 */

import { ComponenteCompartido } from './ComponenteCompartido';

export class NominaService {
  private compartido: ComponenteCompartido;

  constructor() {
    this.compartido = new ComponenteCompartido();
  }

  public obtenerSalarioBase(empleadoId: string): number {
    // Obtenemos los datos desde el componente común
    const datos = this.compartido.obtenerDatos(empleadoId);
    if (datos) {
      return 2000;
    }
    return 0;
  }
}
