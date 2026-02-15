import { EmpleadoService } from './EmpleadoService';

console.log("--- Iniciando ejemplo de dependencia cíclica ---");

try {
  const empleadoService = new EmpleadoService();
  console.log(empleadoService.obtenerDatosEmpleado("1"));
} catch (error) {
  console.error("\n❌ ERROR DETECTADO:");
  console.error(error);
}

// Walkthrough - Ejecución de Dependencia Cíclica
// He ejecutado el archivo 
// EmpleadoService.ts
//  a través de un punto de entrada 
// main.ts
//  para demostrar el problema de arquitectura mencionado en los comentarios del código.

// Resultados de la Ejecución
// Al ejecutar npx tsx main.ts, se produjo el siguiente error:

// bash
// ❌ ERROR DETECTADO:
// RangeError: Maximum call stack size exceeded
//     at new NominaService (NominaService.ts:23:32)
//     at new EmpleadoService (EmpleadoService.ts:22:30)
//     ... (repetido infinitamente)
// ¿Por qué sucede esto?
// EmpleadoService
//  intenta crear una instancia de 
// NominaService
//  en su constructor.
// NominaService
//  intenta crear una instancia de 
// EmpleadoService
//  en su constructor.
// Esto crea un bucle infinito de instanciación que agota la pila de llamadas (Stack Overflow).
// Cómo solucionarlo (Clean Architecture)
// Para romper este ciclo, debemos aplicar el Principio de Inversión de Dependencias (DIP):

// Definir Interfaces: Crear interfaces para los servicios.
// Inyección de Dependencias: Pasar las dependencias al constructor en lugar de crearlas con new.
// Inversión: Ambos servicios deben depender de abstracciones (interfaces), no el uno del otro directamente.
// Puedes ver una solución sugerida en la carpeta 
// dagSolution