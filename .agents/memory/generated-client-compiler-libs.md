---
name: Generated client compiler libs
description: TypeScript library requirement for generated API clients with authorization headers.
---

Keep `DOM.Iterable` in the generated React client’s TypeScript library list when the request wrapper uses `Headers.entries()`.

**Why:** The generated client can typecheck-fail on `Headers.entries()` when only `DOM` is enabled, even though the runtime request code is valid.

**How to apply:** After OpenAPI code generation changes the client, retain DOM.Iterable and typecheck the generated libraries before using their hooks.
