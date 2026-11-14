import "server-only";
import type { z } from "zod";
import { type ApiError, type EndpointName, type ErrorCode, endpoints, type Res } from "./contract";

// Backend helper: wraps a route handler so the body and query are validated against the contract,
// errors come back in the contract's shape, and (outside production) responses are checked too.
//
//   // src/app/api/children/route.ts
//   export const POST = route("addChild", async ({ body }) => { ...; return child; });

type BodyOf<N extends EndpointName> = (typeof endpoints)[N]["body"] extends z.ZodType ? z.output<NonNullable<(typeof endpoints)[N]["body"]>> : undefined;
type QueryOf<N extends EndpointName> = z.output<(typeof endpoints)[N]["query"]>;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const fail = (status: number, code: ErrorCode, message: string) =>
  Response.json({ error: { code, message } } satisfies ApiError, { status });

export function route<N extends EndpointName>(
  name: N,
  handler: (input: { body: BodyOf<N>; query: QueryOf<N>; params: Record<string, string>; request: Request }) => Promise<Res<N>>,
) {
  const endpoint = endpoints[name];
  return async (request: Request, context: { params: Promise<Record<string, string>> }) => {
    const params = (await context?.params) ?? {};
    const query = endpoint.query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return fail(400, "VALIDATION", query.error.message);

    let body: unknown = undefined;
    if (endpoint.body) {
      const parsed = endpoint.body.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return fail(400, "VALIDATION", parsed.error.message);
      body = parsed.data;
    }

    try {
      const result = await handler({ body: body as BodyOf<N>, query: query.data as QueryOf<N>, params, request });
      if (process.env.NODE_ENV !== "production") endpoint.response.parse(result);
      return result === null ? new Response(null, { status: 204 }) : Response.json(result);
    } catch (error) {
      if (error instanceof HttpError) return fail(error.status, error.code, error.message);
      console.error(`${endpoint.method} ${endpoint.path} failed`, error);
      return fail(500, "INTERNAL", "Something went wrong");
    }
  };
}
