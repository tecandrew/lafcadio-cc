import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// OpenCode provides this module at runtime; Plugin.define is the identity function.
mock.module("@opencode/plugin", () => ({ Plugin: { define: (plugin: unknown) => plugin } }));
const { append, lafcadio, payload } = await import("../opencode/lib");

type Hook = (event: any) => Promise<void>;

let root: string;
let project: string;
let log: string;
let path: string | undefined;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "lafcadio-"));
  project = join(root, "project");
  mkdirSync(project);
  log = join(root, "commands.log");
  const bin = join(root, "bin");
  mkdirSync(bin);
  const stub = join(bin, "runner");
  writeFileSync(
    stub,
    "#!/bin/sh\n" +
      '{ printf \'%s\' "${0##*/}"; for arg in "$@"; do printf \'\\t%s\' "$arg"; done; printf \'\\n\'; } >> "$HOOK_LOG"\n' +
      'if [ "${1-}" = "${HOOK_FAIL-}" ]; then echo \'stub failure\' >&2; exit 1; fi\n',
  );
  chmodSync(stub, 0o755);
  for (const name of ["uvx", "bunx"]) symlinkSync(stub, join(bin, name));
  path = process.env.PATH;
  process.env.PATH = `${bin}:${path}`;
  process.env.HOOK_LOG = log;
  delete process.env.HOOK_FAIL;
});

afterEach(() => {
  process.env.PATH = path;
  delete process.env.HOOK_LOG;
  delete process.env.HOOK_FAIL;
  rmSync(root, { recursive: true, force: true });
});

const setup = async (tool: Parameters<typeof lafcadio>[0]) => {
  let hook: Hook | undefined;
  const plugin = lafcadio(tool) as any;
  await plugin.setup({
    location: { directory: project },
    tool: {
      hook: async (name: string, callback: Hook) => {
        expect(name).toBe("execute.after");
        hook = callback;
      },
    },
  });
  expect(plugin.id).toBe(`lafcadio.${tool}`);
  return hook!;
};

const commands = () => {
  try {
    return readFileSync(log, "utf8").trim().split("\n");
  } catch {
    return [];
  }
};

test("maps OpenCode edit tools onto the shared hook payload", () => {
  expect(payload("edit", { path: "a.py", oldString: "a", newString: "b" }, "/p")).toEqual({
    cwd: "/p",
    tool_input: { file_path: "a.py" },
  });
  expect(payload("write", { path: "a.py", content: "" }, "/p")).toEqual({
    cwd: "/p",
    tool_input: { file_path: "a.py" },
  });
  expect(payload("patch", { patchText: "*** Update File: a.py" }, "/p")).toEqual({
    cwd: "/p",
    tool_input: { command: "*** Update File: a.py" },
  });
  expect(payload("read", { path: "a.py" }, "/p")).toBeUndefined();
  expect(payload("edit", null, "/p")).toBeUndefined();
});

test("appends diagnostics without dropping tool output", () => {
  expect(append("done", "diag")).toBe("done\n\ndiag");
  expect(append("", "diag")).toBe("diag");
  expect(append(undefined, "diag")).toEqual([{ type: "text", text: "diag" }]);
  expect(append([{ type: "text", text: "done" }], "diag")).toEqual([
    { type: "text", text: "done" },
    { type: "text", text: "diag" },
  ]);
});

test("successful checks leave the tool result alone", async () => {
  writeFileSync(join(project, "a.py"), "x = 1\n");
  const hook = await setup("ty");
  const event = { tool: "edit", status: "completed", input: { path: "a.py" }, result: { content: "ok" } };

  await hook(event);

  expect(event.result).toEqual({ content: "ok" });
  expect(commands()).toHaveLength(1);
  expect(commands()[0]).toStartWith("uvx\tty\tcheck");
});

test("failed checks are reported to the model", async () => {
  writeFileSync(join(project, "a.py"), "x = 1\n");
  process.env.HOOK_FAIL = "ty";
  const hook = await setup("ty");
  const event = { tool: "write", status: "completed", input: { path: "a.py" }, result: { content: "ok" } };

  await hook(event);

  expect(event.result.content).toStartWith("ok\n\nTy post-edit hook failed:");
  expect(event.result.content).toContain("stub failure");
});

test("patches run each tool on the files they touch", async () => {
  writeFileSync(join(project, "a.ts"), "export {};\n");
  const hook = await setup("oxc");
  const event = {
    tool: "patch",
    status: "completed",
    input: { patchText: "*** Begin Patch\n*** Update File: a.ts\n*** End Patch" },
    result: { content: "ok" },
  };

  await hook(event);

  expect(event.result).toEqual({ content: "ok" });
  expect(commands().some((line) => line.startsWith("bunx\toxfmt"))).toBe(true);
});

test("failed and unrelated tool calls are ignored", async () => {
  writeFileSync(join(project, "a.py"), "x = 1\n");
  const hook = await setup("ruff");

  await hook({ tool: "edit", status: "error", input: { path: "a.py" }, error: new Error("nope") });
  await hook({ tool: "read", status: "completed", input: { path: "a.py" }, result: {} });

  expect(commands()).toEqual([]);
});
