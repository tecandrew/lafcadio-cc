#!/usr/bin/env python3
"""Format and safely lint frontend files changed by an agent edit."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

HEADERS = ("*** Add File: ", "*** Update File: ", "*** Move to: ")
LINT_EXTENSIONS = {
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".ts",
    ".tsx",
    ".mts",
    ".cts",
    ".vue",
    ".svelte",
    ".astro",
}
FORMAT_EXTENSIONS = LINT_EXTENSIONS - {".astro"}


def changed_files(payload: dict[str, object]) -> list[Path]:
    cwd = Path(str(payload.get("cwd") or os.getcwd())).resolve()
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=cwd,
            capture_output=True,
            text=True,
            check=False,
        )
        root = Path(result.stdout.strip()).resolve() if result.returncode == 0 else cwd
    except OSError:
        root = cwd

    tool_input = payload.get("tool_input")
    tool_input = tool_input if isinstance(tool_input, dict) else {}
    raw_paths: list[str] = []
    file_path = tool_input.get("file_path")
    if isinstance(file_path, str):
        raw_paths.append(file_path)
    command = tool_input.get("command")
    if isinstance(command, str):
        for line in command.splitlines():
            for header in HEADERS:
                if line.startswith(header):
                    raw_paths.append(line.removeprefix(header))
                    break

    files: list[Path] = []
    for raw_path in dict.fromkeys(raw_paths):
        path = Path(raw_path)
        path = (path if path.is_absolute() else cwd / path).resolve()
        try:
            path.relative_to(root)
        except ValueError as error:
            raise ValueError(f"refusing path outside repository: {raw_path}") from error
        if path.is_file() and path.suffix in LINT_EXTENSIONS:
            files.append(path)
    return files


def run(command: list[str]) -> None:
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode:
        detail = "\n".join(
            part.strip() for part in (result.stdout, result.stderr) if part.strip()
        )
        raise RuntimeError(detail or f"command failed: {' '.join(command)}")


def run_with_vp_fallback(primary: list[str], fallback: list[str], marker: str) -> None:
    # vite-plus ships LSP-only oxfmt/oxlint wrappers whose error points at the vp CLI
    try:
        run(primary)
    except RuntimeError as error:
        if marker not in str(error):
            raise
        run(fallback)


def main() -> int:
    try:
        files = changed_files(json.load(sys.stdin))
        format_files = [str(path) for path in files if path.suffix in FORMAT_EXTENSIONS]
        lint_files = [str(path) for path in files]
        if format_files:
            run_with_vp_fallback(
                ["bunx", "oxfmt", *format_files],
                ["bunx", "vp", "fmt", *format_files, "--write"],
                "vp fmt",
            )
        if lint_files:
            run_with_vp_fallback(
                ["bunx", "oxlint", "--fix", *lint_files],
                ["bunx", "vp", "lint", "--fix", *lint_files],
                "vp lint",
            )
        return 0
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as error:
        print(f"Oxc post-edit hook failed: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
