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

OpenCode does not have a Git marketplace command. Install directly from this
GitHub repository into OpenCode's global plugin directory:

```sh
mkdir -p ~/.config/opencode/plugins
curl -fsSLo ~/.config/opencode/plugins/lafcadio-ruff.ts https://raw.githubusercontent.com/tecandrew/lafcadio-cc/main/opencode/ruff.ts
curl -fsSLo ~/.config/opencode/plugins/lafcadio-pyrefly.ts https://raw.githubusercontent.com/tecandrew/lafcadio-cc/main/opencode/pyrefly.ts
curl -fsSLo ~/.config/opencode/plugins/lafcadio-ty.ts https://raw.githubusercontent.com/tecandrew/lafcadio-cc/main/opencode/ty.ts
curl -fsSLo ~/.config/opencode/plugins/lafcadio-oxc.ts https://raw.githubusercontent.com/tecandrew/lafcadio-cc/main/opencode/oxc.ts
```

For one project instead, download them into its native project plugin
directory:

```sh
mkdir -p .opencode/plugins
curl -fsSLo .opencode/plugins/lafcadio-ruff.ts https://raw.githubusercontent.com/tecandrew/lafcadio-cc/main/opencode/ruff.ts
curl -fsSLo .opencode/plugins/lafcadio-pyrefly.ts https://raw.githubusercontent.com/tecandrew/lafcadio-cc/main/opencode/pyrefly.ts
curl -fsSLo .opencode/plugins/lafcadio-ty.ts https://raw.githubusercontent.com/tecandrew/lafcadio-cc/main/opencode/ty.ts
curl -fsSLo .opencode/plugins/lafcadio-oxc.ts https://raw.githubusercontent.com/tecandrew/lafcadio-cc/main/opencode/oxc.ts
```

Restart OpenCode after installation. The plugins register native OpenCode LSP
and formatter configuration automatically. To test diagnostics, run
`opencode debug lsp diagnostics path/to/file.py` inside a project.

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

# OpenCode: rerun the relevant curl command from the installation section
```

Start a new agent session after updating.

## Remove

```sh
claude plugin uninstall ruff@lafcadio
codex plugin remove ruff@lafcadio
rm ~/.config/opencode/plugins/lafcadio-ruff.ts
```

Repeat with `pyrefly`, `ty`, or `oxc` as needed. For project-local OpenCode
plugins, remove the file from `.opencode/plugins/` instead.
