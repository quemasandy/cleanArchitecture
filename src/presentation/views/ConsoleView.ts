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

import { ApiGatewayResponse } from './LambdaView';

export class ConsoleView {
  private response: ApiGatewayResponse | null = null;

  renderSuccess(data: any): void {
    console.log("\n✅ [VISTA] Respuesta Exitosa:");
    console.log(JSON.stringify(data, null, 2));

    this.response = {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data || { message: "Success" })
    };
  }

  renderError(error: string): void {
    console.log("\n❌ [VISTA] Error:");
    console.log(`   ${error}`);

    this.response = {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error })
    };
  }

  getResponse(): ApiGatewayResponse {
    return this.response || {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }

  reset(): void {
    this.response = null;
  }
}
