export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** The JSON body of the n-th `fetch` call made during a test. */
export function requestBody(call: number): unknown {
  const body = jest.mocked(globalThis.fetch).mock.calls[call]?.[1]?.body;
  return typeof body === 'string' ? JSON.parse(body) : undefined;
}

export function requestMethod(call: number): string | undefined {
  return jest.mocked(globalThis.fetch).mock.calls[call]?.[1]?.method;
}
