import { Agent, fetch } from "undici";

/**
 * Minimal OPNsense REST client.
 *
 * Auth is HTTP Basic with the API key/secret pair. TLS verification is scoped
 * to the request's dispatcher instead of toggling the process-wide
 * NODE_TLS_REJECT_UNAUTHORIZED variable, which raced with concurrent requests
 * and briefly disabled certificate checks for every outbound call the server
 * made (email, Appwrite, ...).
 */

export interface OpnsenseConnection {
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  verifyTls: boolean;
}

export class OpnsenseApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super( message );
    this.name = "OpnsenseApiError";
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

const secureAgent = new Agent( { keepAliveTimeout: 10_000 } );
// Home routers usually serve a self-signed certificate.
const insecureAgent = new Agent( {
  keepAliveTimeout: 10_000,
  connect: { rejectUnauthorized: false },
} );

export async function opnsenseRequest<T = unknown>(
  connection: OpnsenseConnection,
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  const method = options.method ?? ( options.body ? "POST" : "GET" );
  const url = `${connection.apiBaseUrl.replace( /\/+$/, "" )}/api/${path.replace( /^\/+/, "" )}`;
  const credentials = Buffer.from(
    `${connection.apiKey}:${connection.apiSecret}`,
  ).toString( "base64" );

  let response: Awaited<ReturnType<typeof fetch>>;
  try {
    response = await fetch( url, {
      method,
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
        ...( method === "POST" ? { "Content-Type": "application/json" } : {} ),
      },
      // OPNsense rejects POSTs without a body on some endpoints.
      body: method === "POST" ? JSON.stringify( options.body ?? {} ) : undefined,
      dispatcher: connection.verifyTls ? secureAgent : insecureAgent,
      signal: AbortSignal.timeout( options.timeoutMs ?? DEFAULT_TIMEOUT_MS ),
    } );
  } catch ( error ) {
    const reason = error instanceof Error ? error.message : String( error );
    throw new OpnsenseApiError( `Router unreachable (${path}): ${reason}` );
  }

  if ( !response.ok ) {
    throw new OpnsenseApiError(
      `Router API ${path} responded with ${response.status}`,
      response.status,
    );
  }

  return ( await response.json() ) as T;
}
