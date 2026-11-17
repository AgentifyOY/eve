---
"eve": minor
---

Add `experimental_getStepTools()` to `eve/models`: a custom language model can read the executable tools of the step that calls it, so a model that runs its own tool loop, such as one that wraps an agent CLI, can run eve's tools inside that loop.
The AI SDK passes a model only the tools' schemas. A call the model doesn't run itself, such as one that needs an approval, it returns as an ordinary tool call and eve runs it as before.
