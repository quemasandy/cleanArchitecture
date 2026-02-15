/**
 * SOLUCIÓN 2: CREAR UN NUEVO COMPONENTE
 * -------------------------------------
 * ESTRATEGIA:
 * Identificamos qué funcionalidad de EmpleadoService necesitaba NominaService.
 * (En este caso, 'obtenerDatosEmpleado').
 * 
 * Movemos esa funcionalidad a un TERCER componente ("ComponenteCompartido").
 * 
 * Ahora:
 * - NominaService depende de ComponenteCompartido.
 * - EmpleadoService depende de NominaService y ComponenteCompartido.
 * 
 * RESULTADO:
 * El ciclo se rompe porque NominaService ya no apunta a EmpleadoService.
 * Apunta a un componente de bajo nivel que ambos comparten.
 */

export class ComponenteCompartido {
  // Esta clase contiene la lógica que ambos necesitan, O la lógica de "datos" que causaba la dependencia.

  public obtenerDatos(id: string): string {
    return `Datos compartidos del empleado ${id}`;
  }
}
