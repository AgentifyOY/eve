export * from "#compiled/@workflow/core/index.js";

/**
 * Workflow-safe fetch helper retained for generated or authored workflow code
 * that imports `fetch` from the historical `workflow` package surface.
 */
export async function fetch(...args: Parameters<typeof globalThis.fetch>): Promise<Response> {
  "use step";
  return await globalThis.fetch(...args);
}
// A request may write to another system, so its body starts only once Workflow has recorded its
// start, and a failed request is not sent again.
(fetch as typeof fetch & { maxRetries: number }).maxRetries = 0;
