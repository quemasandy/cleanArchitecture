/**
 * ApiGatewayAdapter.ts
 * 
 * Pattern: ADAPTER
 * 
 * Adapts not the "database" but the "entry point".
 * Translates AWS API Gateway Events (Infrastructure) into 
 * standard Controller calls (Presentation) and standardizes the response.
 */

export interface HelperResponse {
    statusCode: number;
    body: string;
    headers?: Record<string, string>;
}

export class ApiGatewayAdapter {
    static async handle(
        controllerFunction: (body: any) => Promise<any>, 
        event: any
    ): Promise<HelperResponse> {
        try {
            console.log("Incoming Event Body:", event.body);
            
            // 1. Parsing Body (Infrastructure concern: AWS sends JSON string)
            const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

            // 2. Call the Controller (Presentation Layer)
            const result = await controllerFunction(body);

            // 3. Format Response (Infrastructure concern: AWS expects specific JSON structure)
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(result || { message: "Success" })
            };
        } catch (error: any) {
            console.error("Error in Lambda execution:", error);
            
            // Simple transformation of errors to HTTP responses
            return {
                statusCode: 400, // Simplification
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    error: error.message || "Internal Server Error"
                })
            };
        }
    }
}
