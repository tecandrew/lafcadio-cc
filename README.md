# Lafcadio agent plugins

One GitHub repository for Ruff, Pyrefly, Ty, and Oxc integrations across
Claude Code, Codex, and OpenCode.

| Plugin | Files | Behavior |
| --- | --- | --- |
| `ruff` | Python (`.py`, `.pyi`) | Ruff LSP where supported, formatting, and safe lint fixes |
| `pyrefly` | Python (`.py`, `.pyi`) | Pyrefly LSP where supported and type diagnostics |
| `ty` | Python (`.py`, `.pyi`) | Ty LSP where supported and type diagnostics |
| `oxc` | JS/TS, Vue, Svelte, Astro | Oxlint LSP where supported, Oxfmt formatting, and safe lint fixes |

## Requirements

- [uv](https://docs.astral.sh/uv/) for `uvx ruff`, `uvx pyrefly`, and `uvx ty`
- [Bun](https://bun.sh/) for `bunx oxfmt` and `bunx oxlint`
- Python 3 on `PATH` as `python3`, which runs the post-edit hooks in every harness

The first tool run may need network access. Project Ruff, Pyrefly, Oxfmt, and
Oxlint configuration is respected.

## Install from GitHub

Install any subset of the four plugins. The examples below install all four.

### Claude Code

Add the GitHub repository as a marketplace, then install the plugins:

```sh
claude plugin marketplace add tecandrew/lafcadio-cc
claude plugin install ruff@lafcadio
claude plugin install pyrefly@lafcadio
claude plugin install ty@lafcadio
claude plugin install oxc@lafcadio
```

Start a new Claude Code session after installation. Check installed plugins
with `claude plugin list`.

### Codex

Add the GitHub repository as a marketplace, then install the plugins:

```sh
codex plugin marketplace add tecandrew/lafcadio-cc
codex plugin add ruff@lafcadio
codex plugin add pyrefly@lafcadio
codex plugin add ty@lafcadio
codex plugin add oxc@lafcadio
```

Start a new Codex session, run `/hooks`, and review and trust the installed
hooks. Check installation with `codex plugin list`.

Codex does not currently expose plugin LSP registration. Its plugins run the
same formatter, lint, and type-check CLIs after edits and return diagnostics to
the agent.

### OpenCode

These plugins target OpenCode V2. OpenCode has no Git marketplace command, and
the plugins share the Python hooks in `plugins/`, so clone the repository and
point OpenCode at the plugin directories:

```sh
git clone https://github.com/tecandrew/lafcadio-cc ~/.local/share/lafcadio-cc
```

Then add the plugins you want to `plugins` in `~/.config/opencode/opencode.json`,
or in a project's `opencode.json` to enable them for one project. Use absolute
paths:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "/Users/you/.local/share/lafcadio-cc/opencode/ruff",
    "/Users/you/.local/share/lafcadio-cc/opencode/pyrefly",
    "/Users/you/.local/share/lafcadio-cc/opencode/ty",
    "/Users/you/.local/share/lafcadio-cc/opencode/oxc"
  ]
}
```

OpenCode reloads plugins when the config changes. After each `edit`, `write`,
or `patch`, the plugins run the same hooks as Claude Code and Codex, and any
diagnostics are appended to the tool result.

OpenCode V2 does not run language servers, so these plugins don't register any.
For formatting on save, OpenCode's built-in `ruff` and `oxfmt` formatters work
when you set `"formatter": true` and the tools are installed in the project.

If you installed the older single-file plugins (`lafcadio-*.ts` in
`~/.config/opencode/plugins/` or `.opencode/plugins/`), delete them. They use
the V1 plugin API and do not run in V2.

Oxfmt supports Vue directly. Svelte formatting also requires the project's
`svelte` package and Oxfmt's `svelte` option. Astro is linted by Oxlint but is
not formatted by Oxfmt.

## Update

```sh
# Claude Code
claude plugin marketplace update lafcadio
claude plugin update ruff@lafcadio
claude plugin update pyrefly@lafcadio
claude plugin update ty@lafcadio
claude plugin update oxc@lafcadio

# Codex: refresh the GitHub marketplace, then reinstall the desired plugins
codex plugin marketplace upgrade lafcadio
codex plugin add ruff@lafcadio
codex plugin add pyrefly@lafcadio
codex plugin add ty@lafcadio
codex plugin add oxc@lafcadio

# OpenCode: pull the clone; OpenCode reloads plugins on the next config change or /reload
git -C ~/.local/share/lafcadio-cc pull
```

Start a new agent session after updating.

## Remove

```sh
claude plugin uninstall ruff@lafcadio
codex plugin remove ruff@lafcadio
```

Repeat with `pyrefly`, `ty`, or `oxc` as needed. For OpenCode, remove the
plugin's entry from `plugins` in `opencode.json`.
