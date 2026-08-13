---
name: ty
description: Type-check, diagnose, or review Python files with Ty. Use for Python typing work and type errors.
---

# Ty

After Python edits, the bundled hook prefers Ty from the nearest project `.venv`, then falls back to `uvx ty`. It checks changed `.py` and `.pyi` files against their nearest project and reports errors without rewriting them.

For an explicit repository-wide check, run:

```sh
uvx ty check
```

Treat diagnostics as feedback, fix the source types, and rerun the check before completion.
