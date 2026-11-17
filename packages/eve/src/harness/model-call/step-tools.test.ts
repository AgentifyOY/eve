import type { ToolSet } from "ai";
import { describe, expect, it } from "vitest";

import { experimental_getStepTools, withStepTools } from "#harness/model-call/step-tools.js";

describe("experimental_getStepTools", () => {
  it("returns the step's tools to a model called inside the step, and nothing outside it", async () => {
    const tools = { lookup: { execute: async () => "ok", inputSchema: {} } } as unknown as ToolSet;
    const seen = await withStepTools(tools, async () => {
      await Promise.resolve();
      return experimental_getStepTools();
    });
    expect(seen).toBe(tools);
    expect(experimental_getStepTools()).toBeUndefined();
  });
});
