import { Plugin } from "@opencode/plugin";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

type Tool = "ruff" | "pyrefly" | "ty" | "oxc";
type Content = string | ReadonlyArray<{ type: string; [key: string]: unknown }> | undefined;

const TIMEOUT_MS = 120_000;

// Map an OpenCode edit tool call onto the payload shape the shared hooks read.
export const payload = (tool: string, input: unknown, cwd: string) => {
  const args = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if ((tool === "edit" || tool === "write") && typeof args.path === "string") {
    return { cwd, tool_input: { file_path: args.path } };
  }
  if (tool === "patch" && typeof args.patchText === "string") {
    return { cwd, tool_input: { command: args.patchText } };
  }
  return undefined;
};

const run = (script: string, input: object) =>
  new Promise<{ code: number | null; output: string }>((resolve) => {
    const child = spawn("python3", [script], { stdio: ["pipe", "pipe", "pipe"], timeout: TIMEOUT_MS });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("error", (error) => resolve({ code: 1, output: `could not run python3: ${error.message}` }));
    child.on("close", (code) => resolve({ code, output: output.trim() }));
    child.stdin.end(JSON.stringify(input));
  });

export const append = (content: Content, text: string): Content => {
  if (typeof content === "string") return content ? `${content}\n\n${text}` : text;
  return [...(content ?? []), { type: "text", text }];
};

export const lafcadio = (tool: Tool) => {
  const script = fileURLToPath(new URL(`../plugins/${tool}/hooks/post_edit.py`, import.meta.url));
  return Plugin.define({
    id: `lafcadio.${tool}`,
    async setup(ctx) {
      await ctx.tool.hook("execute.after", async (event) => {
        if (event.status !== "completed") return;
        const input = payload(event.tool, event.input, ctx.location.directory);
        if (!input) return;
        const { code, output } = await run(script, input);
        if (code === 0) return;
        event.result = { ...event.result, content: append(event.result.content, output) };
      });
    },
  });
};
