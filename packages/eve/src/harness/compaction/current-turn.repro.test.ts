import type { ModelMessage } from "ai";
import { expect, it } from "vitest";
import { estimateTokens } from "#harness/token-estimate.js";
import { compactMessages } from "./engine.js";

const big = (label: string, chars: number) => `${label}: ${"row ".repeat(chars / 4)}`;

let callId = 0;
const toolCall = (chars: number): ModelMessage[] => {
  const toolCallId = `call-${++callId}`;
  return [
    {
      role: "assistant",
      content: [{ type: "tool-call", toolCallId, toolName: "list_rows", input: { page: callId } }],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId,
          toolName: "list_rows",
          output: { type: "text", value: big(`result ${callId}`, chars) },
        },
      ],
    },
  ];
};

const olderTurns: ModelMessage[] = [];
for (let turn = 0; turn < 6; turn++) {
  olderTurns.push(
    { role: "user", content: `older request ${turn}` },
    ...toolCall(30_000),
    ...toolCall(30_000),
    { role: "assistant", content: `answer ${turn}` },
  );
}

const currentTurn: ModelMessage[] = [
  {
    role: "user",
    content: [
      {
        type: "text",
        text: `Read this contract and list every deadline.\n\n${big("pasted contract", 120_000)}`,
      },
    ],
  },
  ...toolCall(9_000),
  ...toolCall(9_000),
  ...toolCall(9_000),
];

const config = {
  contextWindowTokens: 200_000,
  recentWindowSize: 10,
  target: 40_000,
  threshold: 60_000,
};

it("keeps the current turn byte-identical when it fits under the threshold", async () => {
  expect(estimateTokens(currentTurn)).toBeLessThan(config.threshold);

  const { messages } = await compactMessages(
    [...olderTurns, ...currentTurn],
    config,
    async () => "Summary of the older turns.",
  );

  const kept = currentTurn.filter((message) =>
    messages.some((candidate) => JSON.stringify(candidate) === JSON.stringify(message)),
  );
  expect(kept.length).toBe(currentTurn.length);
});
