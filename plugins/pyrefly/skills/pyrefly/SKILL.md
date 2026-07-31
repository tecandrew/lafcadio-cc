---
name: pyrefly
description: Type-check, diagnose, or review Python files with Pyrefly. Use for Python typing work and type errors.
---

# Pyrefly

After Python edits, the bundled hook runs `uvx pyrefly check` on changed `.py` and `.pyi` files and reports errors without rewriting them.

For an explicit repository-wide check, run:

```sh
uvx pyrefly check
```

Treat diagnostics as feedback, fix the source types, and rerun the check before completion.
