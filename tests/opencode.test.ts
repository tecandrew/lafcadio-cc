import { expect, test } from "bun:test";
import { OxcPlugin } from "../opencode/oxc";
import { PyreflyPlugin } from "../opencode/pyrefly";
import { RuffPlugin } from "../opencode/ruff";
import { TyPlugin } from "../opencode/ty";

test("plugins add native formatter and LSP configuration", async () => {
  const config: any = { formatter: false, lsp: false };
  for (const create of [RuffPlugin, PyreflyPlugin, TyPlugin, OxcPlugin]) {
    const plugin = await create();
    await plugin.config(config);
  }

  expect(config.formatter.ruff.command).toEqual(["uvx", "ruff", "format", "$FILE"]);
  expect(config.formatter["ruff-fix"].command).toEqual(["uvx", "ruff", "check", "--fix", "$FILE"]);
  expect(config.lsp.ruff.command).toEqual(["uvx", "ruff", "server", "--color", "never"]);
  expect(config.lsp.pyrefly.command).toEqual(["uvx", "pyrefly", "lsp", "--color", "never"]);
  expect(config.lsp.ty.command).toEqual(["uvx", "ty", "server"]);
  expect(config.lsp.oxlint.command).toEqual(["bunx", "oxlint", "--lsp"]);
});

test("explicit named configuration wins", async () => {
  const config: any = {
    formatter: { ruff: { disabled: true } },
    lsp: { ruff: { command: ["custom-ruff"] } },
  };
  const plugin = await RuffPlugin();

  await plugin.config(config);

  expect(config.formatter.ruff).toEqual({ disabled: true });
  expect(config.formatter["ruff-fix"]).toBeUndefined();
  expect(config.lsp.ruff.command).toEqual(["custom-ruff"]);
});

test("Oxc formats framework files only where supported", async () => {
  const config: any = {};
  const plugin = await OxcPlugin();

  await plugin.config(config);

  expect(config.formatter.oxfmt.extensions).toContain(".vue");
  expect(config.formatter.oxfmt.extensions).toContain(".svelte");
  expect(config.formatter.oxfmt.extensions).not.toContain(".astro");
  expect(config.formatter["oxlint-fix"].extensions).toContain(".astro");
  expect(config.lsp.oxlint.extensions).toContain(".astro");
});

test("each plugin tells the agent how its tools affect files", async () => {
  for (const create of [RuffPlugin, PyreflyPlugin, TyPlugin, OxcPlugin]) {
    const plugin = await create();
    const output = { system: [] as string[] };
    await plugin["experimental.chat.system.transform"]({}, output);
    expect(output.system).toHaveLength(1);
  }
});
