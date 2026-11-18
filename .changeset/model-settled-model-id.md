---
"eve": minor
---

`model.settled` now carries `modelId` when the provider's response names a different model than the one eve requested, so a run records which model actually answered.
`model.started`'s `modelId` stays the model eve chose. The field is absent when the response names the requested model or none.
