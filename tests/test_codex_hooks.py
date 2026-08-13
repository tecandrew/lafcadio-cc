import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]


class CodexHookTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.project = self.root / "project"
        self.project.mkdir()
        self.log = self.root / "commands.log"
        bin_dir = self.root / "bin"
        bin_dir.mkdir()
        stub = bin_dir / "runner"
        stub.write_text(
            "#!/bin/sh\n"
            '{ printf \'%s\' "${0##*/}"; for arg in "$@"; do printf \'\\t%s\' "$arg"; done; printf \'\\n\'; } >> "$HOOK_LOG"\n'
            'if [ "${1-}" = "${HOOK_FAIL-}" ]; then echo \'stub failure\' >&2; exit 1; fi\n'
        )
        stub.chmod(0o755)
        for name in ("uvx", "bunx"):
            (bin_dir / name).symlink_to(stub)
        self.env = {**os.environ, "PATH": str(bin_dir), "HOOK_LOG": str(self.log)}

    def tearDown(self) -> None:
        self.temp.cleanup()

    def run_hook(
        self, plugin: str, tool_input: dict[str, str], **env: str
    ) -> subprocess.CompletedProcess[str]:
        payload = {"cwd": str(self.project), "tool_input": tool_input}
        return subprocess.run(
            [sys.executable, str(REPO / "plugins" / plugin / "hooks" / "post_edit.py")],
            input=json.dumps(payload),
            capture_output=True,
            text=True,
            env={**self.env, **env},
            check=False,
        )

    def commands(self) -> list[str]:
        return self.log.read_text().splitlines() if self.log.exists() else []

    def test_ruff_supports_direct_file_paths(self) -> None:
        target = self.project / "typed file.pyi"
        target.write_text("value: int = 1\n")

        result = self.run_hook("ruff", {"file_path": str(target)})

        self.assertEqual(result.returncode, 0, result.stderr)
        commands = self.commands()
        self.assertEqual(len(commands), 2)
        self.assertEqual(commands[0], f"uvx\truff\tformat\t{target.resolve()}")
        self.assertEqual(commands[1], f"uvx\truff\tcheck\t--fix\t{target.resolve()}")

    def test_ruff_prefers_project_environment(self) -> None:
        target = self.project / "typed.py"
        target.write_text("value: int = 1\n")
        executable = (
            self.project
            / ".venv"
            / ("Scripts/ruff.exe" if os.name == "nt" else "bin/ruff")
        )
        executable.parent.mkdir(parents=True)
        executable.symlink_to(self.root / "bin" / "runner")

        result = self.run_hook("ruff", {"file_path": str(target)})

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(
            self.commands(),
            [
                f"ruff\tformat\t{target.resolve()}",
                f"ruff\tcheck\t--fix\t{target.resolve()}",
            ],
        )

    def test_pyrefly_parses_move_and_deduplicates_paths(self) -> None:
        target = self.project / "new name.py"
        target.write_text("value: int = 1\n")
        patch = (
            "*** Begin Patch\n"
            "*** Update File: old.py\n"
            "*** Move to: new name.py\n"
            "*** Update File: new name.py\n"
            "*** Delete File: deleted.py\n"
            "*** End Patch"
        )

        result = self.run_hook("pyrefly", {"command": patch})

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.commands(), [f"uvx\tpyrefly\tcheck\t{target.resolve()}"])

    def test_ty_checks_python_edits(self) -> None:
        target = self.project / "typed.py"
        target.write_text("value: int = 1\n")

        result = self.run_hook("ty", {"file_path": str(target)})

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(
            self.commands(),
            [
                f"uvx\tty\tcheck\t--project\t{self.project.resolve()}\t{target.resolve()}"
            ],
        )

    def test_ty_prefers_nested_project_environment(self) -> None:
        backend = self.project / "src" / "backend"
        backend.mkdir(parents=True)
        (backend / "pyproject.toml").write_text("[project]\nname = 'backend'\n")
        target = backend / "typed.py"
        target.write_text("value: int = 1\n")
        executable = (
            backend / ".venv" / ("Scripts/ty.exe" if os.name == "nt" else "bin/ty")
        )
        executable.parent.mkdir(parents=True)
        executable.symlink_to(self.root / "bin" / "runner")

        result = self.run_hook("ty", {"file_path": str(target)})

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(
            self.commands(),
            [f"ty\tcheck\t--project\t{backend.resolve()}\t{target.resolve()}"],
        )

    def test_oxc_lints_astro_without_formatting_it(self) -> None:
        names = ("app.ts", "View.vue", "Widget.svelte", "Page.astro", "notes.md")
        for name in names:
            (self.project / name).write_text("")
        patch = "\n".join(f"*** Update File: {name}" for name in names)

        result = self.run_hook("oxc", {"command": patch})

        self.assertEqual(result.returncode, 0, result.stderr)
        format_command, lint_command = self.commands()
        self.assertNotIn("Page.astro", format_command)
        self.assertNotIn("notes.md", format_command)
        self.assertIn("View.vue", format_command)
        self.assertIn("Widget.svelte", format_command)
        self.assertIn("Page.astro", lint_command)
        self.assertNotIn("notes.md", lint_command)

    def test_skips_paths_outside_the_project(self) -> None:
        outside = self.root / "outside.py"
        outside.write_text("value = 1\n")

        result = self.run_hook("pyrefly", {"command": "*** Update File: ../outside.py"})

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.commands(), [])

    def test_command_failure_is_returned_as_hook_feedback(self) -> None:
        target = self.project / "broken.py"
        target.write_text("value = 1\n")

        result = self.run_hook(
            "pyrefly", {"file_path": str(target)}, HOOK_FAIL="pyrefly"
        )

        self.assertEqual(result.returncode, 2)
        self.assertIn("stub failure", result.stderr)


if __name__ == "__main__":
    unittest.main()
