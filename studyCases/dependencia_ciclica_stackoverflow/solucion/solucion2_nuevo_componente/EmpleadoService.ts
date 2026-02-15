/**
 * SOLUCIÓN 2: LADO EMPLEADO
 * -------------------------
 * EmpleadoService sigue siendo el orquestador principal o de "alto nivel" en este flujo.
 * 
 * DEPENDENCIAS ORIGEN:
 * EmpleadoService -> NominaService
 * 
 * DEPENDENCIAS NUEVAS:
 * EmpleadoService -> ComponenteCompartido (opcional si lo usa también)
 * 
 * ANÁLISIS DAG:
 * EmpleadoService -> NominaService -> ComponenteCompartido
 * EmpleadoService -> ComponenteCompartido
 * 
 * Todas las flechas fluyen en una dirección. No hay camino para volver de ComponenteCompartido a EmpleadoService.
 * ¡GRAFO ACÍCLICO CONSEGUIDO!
 */

import { NominaService } from './NominaService';
import { ComponenteCompartido } from './ComponenteCompartido';

export class EmpleadoService {
  private nominaService: NominaService;
  private compartido: ComponenteCompartido;

  constructor() {
    this.nominaService = new NominaService();
    this.compartido = new ComponenteCompartido();
  }

  public obtenerDatosEmpleado(id: string): string {
    // Puede delegar al compartido o usar su propia lógica
    return this.compartido.obtenerDatos(id);
  }

  public calcularSalarioTotal(id: string): number {
    // A -> B
    return this.nominaService.obtenerSalarioBase(id) + 1000;
  }
}
