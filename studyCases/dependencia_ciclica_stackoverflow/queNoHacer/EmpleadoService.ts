/**
 * PROBLEMA DE ARQUITECTURA: DEPENDENCIA CÍCLICA
 * ---------------------------------------------
 * En este ejemplo, EmpleadoService depende directamente de NominaService.
 * Como verás en NominaService.ts, ese módulo TAMBIÉN depende de EmpleadoService.
 * 
 * EL PROBLEMA "MEGA-COMPONENTE":
 * - Cuando dos componentes dependen el uno del otro, se vuelven inseparables.
 * - No puedes compilar, probar o desplegar EmpleadoService sin NominaService, y viceversa.
 * - En la práctica, se convierten en un solo componente gigante (o "Mega-Componente").
 * - Cualquier cambio en NominaService podría romper EmpleadoService, forzando a recompilar y redestribuir ambos.
 * - Esto viola el principio ADP (Acyclic Dependencies Principle).
 */

import { NominaService } from './NominaService';

export class EmpleadoService {
    private nominaService: NominaService;

    constructor() {
        // A -> B: Dependencia directa (fuerte acoplamiento)
        this.nominaService = new NominaService(); 
    }

    public obtenerDatosEmpleado(id: string): string {
        return `Datos del empleado ${id}`;
    }

    public calcularSalarioTotal(id: string): number {
        // Uso de la dependencia
        return this.nominaService.obtenerSalarioBase(id) + 1000; // Bono
    }
}
