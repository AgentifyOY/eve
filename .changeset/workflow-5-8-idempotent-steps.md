---
"eve": patch
---

eve now runs on Workflow SDK 5.8, and a session step that Workflow runs a second time no longer posts its channel messages twice.

Workflow 5.8 starts a step's body before its start is recorded and runs it again when that record is lost, as the same attempt. Every durable session step now folds the session lines an earlier copy already wrote instead of posting them again, a workflow tool call's run takes a hook named for the step that started it so a second start can't take the call, and the `fetch` step from `eve/workflow` runs only once its start is recorded and is not retried.
