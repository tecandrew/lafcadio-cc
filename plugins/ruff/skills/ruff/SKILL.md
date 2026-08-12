---
name: ruff
description: Format, lint, fix, or review Python files with Ruff. Use for Python edits and Python code-quality checks.
---

# Ruff

After Python edits, the bundled hook prefers Ruff from the nearest project `.venv`, then falls back to `uvx ruff`. It formats and applies safe lint fixes to changed `.py` and `.pyi` files.

For an explicit repository-wide check, run:

```sh
uvx ruff format --check .
uvx ruff check .
```

Respect the project's Ruff configuration. Report any diagnostics that cannot be fixed safely.
