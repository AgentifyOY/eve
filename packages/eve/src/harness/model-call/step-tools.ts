import { AsyncLocalStorage } from "node:async_hooks";

import type { ToolSet } from "ai";

const stepTools = new AsyncLocalStorage<ToolSet>();

/** Runs `fn` with the step's tool set in reach of the model the step calls. */
export function withStepTools<T>(tools: ToolSet, fn: () => T): T {
  return stepTools.run(tools, fn);
}

/**
 * The tools of the model step that is calling the model, with their `execute`, or `undefined`
 * outside a step. The AI SDK hands a language model only the tools' schemas; a custom model that
 * runs its own tool loop, such as one that wraps an agent CLI, reads them here to run a tool
 * inside its loop. A call it doesn't run, such as one that needs an approval, it returns as an
 * ordinary tool call, and eve runs it.
 *
 * @experimental
 */
export function experimental_getStepTools(): ToolSet | undefined {
  return stepTools.getStore();
}
