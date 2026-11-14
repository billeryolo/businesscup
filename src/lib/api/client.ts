// The only way the frontend talks to the backend. Every call is typed from contract.ts and every
// response is checked against the schema, so a mismatch shows up as an error right away instead
// of a blank screen on demo day.
//
//   const child = await api("addChild", { body: { firstName: "Mia", grade: 2 } });
//   const progress = await api("progress", { params: { childId: child.id } });
//
// NEXT_PUBLIC_API_MOCK=1 answers from mocks.ts with a short delay, no backend needed.

import { ApiError, type EndpointName, type ErrorCode, endpoints, type Query, type Req, type Res } from "./contract";

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export type CallArgs<N extends EndpointName> = {
  params?: Record<string, string>;
  query?: Query<N>;
  body?: Req<N>;
};

const isMock = () => process.env.NEXT_PUBLIC_API_MOCK === "1";

export function buildPath(name: EndpointName, params: Record<string, string> = {}): string {
  return endpoints[name].path.replace(/:(\w+)/g, (_, key: string) => {
    const value = params[key];
    if (!value) throw new Error(`api("${name}"): missing path param "${key}"`);
    return encodeURIComponent(value);
  });
}

function queryString(query: object | undefined): string {
  if (!query) return "";
  const pairs = Object.entries(query).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => [k, String(v)]);
  return pairs.length ? `?${new URLSearchParams(pairs)}` : "";
}

export async function api<N extends EndpointName>(name: N, args: CallArgs<N> = {}): Promise<Res<N>> {
  const endpoint = endpoints[name];
  const path = buildPath(name, args.params);

  if (isMock()) {
    const { mockHandler } = await import("./mocks");
    await new Promise((r) => setTimeout(r, 250));
    try {
      return endpoint.response.parse(await mockHandler(name, args)) as Res<N>;
    } catch (error) {
      if (error instanceof ApiRequestError) throw error;
      throw new ApiRequestError(500, "INTERNAL", `Mock for "${name}" does not match the contract: ${String(error)}`);
    }
  }

  const response = await fetch(path + queryString(args.query as object | undefined), {
    method: endpoint.method,
    headers: endpoint.body ? { "content-type": "application/json" } : undefined,
    body: endpoint.body ? JSON.stringify(args.body ?? {}) : undefined,
    credentials: "same-origin",
  });

  if (!response.ok) {
    const parsed = ApiError.safeParse(await response.json().catch(() => null));
    if (parsed.success) throw new ApiRequestError(response.status, parsed.data.error.code, parsed.data.error.message);
    throw new ApiRequestError(response.status, "INTERNAL", response.statusText || "Request failed");
  }

  const data = response.status === 204 ? null : await response.json();
  const checked = endpoint.response.safeParse(data);
  if (!checked.success) {
    throw new ApiRequestError(500, "INTERNAL", `Response from ${endpoint.method} ${endpoint.path} does not match the contract: ${checked.error.message}`);
  }
  return checked.data as Res<N>;
}
