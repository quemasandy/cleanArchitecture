/**
 * Archivo: LambdaView.ts
 * UBICACIÓN: Capa de Presentación / Vistas
 *
 * Vista específica para AWS Lambda + API Gateway.
 * Construye directamente la respuesta HTTP en el formato que AWS espera.
 *
 * - Para quién trabaja: AWS API Gateway.
 * - Intención: Devolver respuestas HTTP estructuradas para Lambda.
 * - Misión: Renderizar resultados directamente como API Gateway Response.
 */

export interface ApiGatewayResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}

export class LambdaView {
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
