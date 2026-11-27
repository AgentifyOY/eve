// Reads the local World store an `eve eval --keep-state` run left behind and
// prints Workflow's step-to-step overhead plus five-turn loop times.
//
//   node scripts/bench/workflow-step-overhead.mjs <eval-server-state-dir> [eval-log]
//
// Step-to-step overhead is the gap between one step finishing and the next
// step of the same run starting. Five-turn loop time is the wall time of five
// consecutive turns, taken from the `turn NNN/100 completed in Xs` lines of the
// eval log.
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const [stateDir, logFile] = process.argv.slice(2);
if (!stateDir) {
  console.error("usage: workflow-step-overhead.mjs <eval-server-state-dir> [eval-log]");
  process.exit(1);
}

const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
};
const fmt = (values) =>
  `p50 ${percentile(values, 50).toFixed(1)} ms, p75 ${percentile(values, 75).toFixed(1)} ms, p95 ${percentile(values, 95).toFixed(1)} ms (n=${values.length})`;

// world-local 5.6+ keeps steps in SQLite; earlier versions wrote one JSON file per step.
async function readStepsByRun(dataDir) {
  const byRun = new Map();
  const add = (step) => byRun.set(step.runId, [...(byRun.get(step.runId) ?? []), step]);
  const dbFile = join(dataDir, "world.db");
  if (existsSync(dbFile)) {
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync(dbFile, { readOnly: true });
    for (const { doc } of db.prepare("select doc from steps").all()) add(JSON.parse(doc));
    return byRun;
  }
  const stepsRoot = join(dataDir, "steps");
  for (const run of await readdir(stepsRoot)) {
    for (const file of await readdir(join(stepsRoot, run))) {
      add(JSON.parse(await readFile(join(stepsRoot, run, file), "utf8")));
    }
  }
  return byRun;
}

// SQLite docs carry dates as `{ __type: "Date", value }`.
const time = (date) => Date.parse(date?.value ?? date);
const gaps = [];
for (const runSteps of (await readStepsByRun(join(stateDir, ".workflow-data"))).values()) {
  const steps = runSteps
    .filter((step) => step.startedAt && (step.completedAt ?? step.updatedAt))
    .map((step) => ({
      start: time(step.startedAt),
      end: time(step.completedAt ?? step.updatedAt),
    }))
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < steps.length; i += 1) {
    // Concurrent steps overlap; only a step that starts after its predecessor ends is a hop.
    const gap = steps[i].start - steps[i - 1].end;
    if (gap >= 0) gaps.push(gap);
  }
}
console.log(`step-to-step overhead: ${fmt(gaps)}`);

if (logFile) {
  const turns = [
    ...(await readFile(logFile, "utf8")).matchAll(/turn \d+\/\d+ completed in ([\d.]+)s/g),
  ].map((match) => Number(match[1]) * 1000);
  const loops = [];
  for (let i = 0; i + 5 <= turns.length; i += 5)
    loops.push(turns.slice(i, i + 5).reduce((a, b) => a + b, 0));
  console.log(`turn time: ${fmt(turns)}`);
  console.log(`five-turn loop: ${fmt(loops)}`);
}
