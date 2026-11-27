/** The part of a Workflow World's streams a step copy's claim uses. */
export interface ClaimStreams {
  write(runId: string, name: string, chunk: string | Uint8Array): Promise<void>;
  getChunks(
    runId: string,
    name: string,
    options?: { readonly limit?: number },
  ): Promise<{ readonly data: readonly { readonly data: Uint8Array }[] }>;
}

/**
 * Whether this copy of a step attempt is the first to claim it. Each copy appends a token of its
 * own to the attempt's claim stream, then reads the stream's first chunk. A stream's chunks have
 * one order for every reader, so all copies read the same first token and exactly one finds its
 * own, however their calls interleave.
 */
export async function claimFirstCopy(
  streams: ClaimStreams,
  runId: string,
  name: string,
): Promise<boolean> {
  const token = crypto.randomUUID();
  await streams.write(runId, name, token);
  const [first] = (await streams.getChunks(runId, name, { limit: 1 })).data;
  if (first === undefined) throw new Error("A step copy's claim was written but not read back.");
  return new TextDecoder().decode(first.data) === token;
}

/**
 * The claim stream of attempt `attempt` of step `stepId` in run `runId`, named as Workflow names a
 * run's own streams so every World stores it.
 */
export function stepClaimStreamName(runId: string, stepId: string, attempt: number): string {
  const namespace = Buffer.from(`eve.step-claim:${stepId}:${attempt}`, "utf-8").toString(
    "base64url",
  );
  return `${runId.replace("wrun_", "strm_")}_user_${namespace}`;
}
