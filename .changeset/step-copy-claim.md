---
"eve": patch
---

A session step that Workflow runs as two copies at the same time now writes its lines and runs its channel handlers once, so a Slack, Teams or email reply no longer goes out twice.

The first copy to claim the step's attempt writes the session stream and posts. The other copy writes nothing, reads each line the first copy writes, and folds it into its own state.
