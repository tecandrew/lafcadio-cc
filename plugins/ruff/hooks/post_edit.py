"""Format and safely fix Python files changed by an agent edit."""

import json
import os
import subprocess
import sys
from pathlib import Path

HEADERS = ("*** Add File: ", "*** Update File: ", "*** Move to: ")
EXTENSIONS = {".py", ".pyi"}


def changed_files(payload: dict[str, object]) -> tuple[Path, list[Path]]:
    cwd = Path(str(payload.get("cwd") or Path.cwd())).resolve()
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
        if not path.is_relative_to(root):
            # outside the repo (scratchpad, /tmp): not ours to touch
            continue
        if path.is_file() and path.suffix in EXTENSIONS:
            files.append(path)
    return root, files


def ruff_command(path: Path, root: Path) -> tuple[str, ...]:
    executable = Path("Scripts/ruff.exe" if os.name == "nt" else "bin/ruff")
    for parent in path.parents:
        candidate = parent / ".venv" / executable
        if candidate.is_file():
            return (str(candidate),)
        if parent == root:
            break
    return ("uvx", "ruff")


def run(command: list[str]) -> None:
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode:
        detail = "\n".join(
            part.strip() for part in (result.stdout, result.stderr) if part.strip()
        )
        raise RuntimeError(detail or f"command failed: {' '.join(command)}")


def main() -> int:
    try:
        root, files = changed_files(json.load(sys.stdin))
        groups: dict[tuple[str, ...], list[str]] = {}
        for path in files:
            groups.setdefault(ruff_command(path, root), []).append(str(path))
        for command, paths in groups.items():
            run([*command, "format", *paths])
            run([*command, "check", "--fix", *paths])
        return 0
    except (OSError, ValueError, RuntimeError) as error:
        print(f"Ruff post-edit hook failed: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
