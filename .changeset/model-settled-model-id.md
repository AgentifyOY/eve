---
"eve": minor
---

`model.settled` now carries `modelId`, the model the provider's response says answered, so a run that a gateway fell back to another model records which model actually replied.
`model.started`'s `modelId` stays the model eve chose. The field is absent when the response names no model.
