/**
 * Archivo: ConsoleView.ts
 * UBICACIÓN: Capa de Presentación / Vistas
 *
 * Simula una "Vista" que renderiza la respuesta.
 * En una API REST, esto sería el JSON response.
 * En una web MVC, sería el HTML.
 *
 * - Para quién trabaja: El Usuario Final.
 * - Intención: Mostrar la información de respuesta de forma legible.
 * - Misión: Renderizar los resultados de las operaciones en la consola (Standard Output).
 */

export class ConsoleView {
  renderSuccess(data: any): void {
    console.log("\n✅ [VISTA] Respuesta Exitosa:");
    console.log(JSON.stringify(data, null, 2));
  }

  renderError(error: string): void {
    console.log("\n❌ [VISTA] Error:");
    console.log(`   ${error}`);
  }
}
