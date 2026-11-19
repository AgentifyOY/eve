---
"eve": patch
---

Compaction now keeps the current turn word for word: the request and every tool call and result after it stay byte-identical, and only earlier turns are summarized.

A model that lost part of its own turn to compaction could answer an earlier message instead. The current turn is now cut only when it alone no longer fits the model's context window, where no history around it could be sent.
