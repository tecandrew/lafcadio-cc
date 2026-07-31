---
name: oxc
description: Format, lint, fix, or review JavaScript, TypeScript, Vue, Svelte, and Astro files with Oxfmt and Oxlint.
---

# Oxc

After frontend edits, the bundled hook runs Oxfmt where supported and then applies safe Oxlint fixes. Astro receives Oxlint diagnostics but is not sent to Oxfmt.

For explicit checks, run:

```sh
bunx oxfmt --check .
bunx oxlint .
```

Respect project Oxc configuration. Use only `oxlint --fix` automatically; suggestions and dangerous fixes require explicit user intent.
