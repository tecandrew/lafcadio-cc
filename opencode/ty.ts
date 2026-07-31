type Entry = { disabled?: boolean; command?: string[]; extensions?: string[] };
type Config = { lsp?: boolean | Record<string, Entry> };

const PYTHON = [".py", ".pyi"];

export const TyPlugin = async () => ({
  config: async (config: Config) => {
    const lsp = config.lsp && typeof config.lsp === "object" ? config.lsp : {};
    lsp.ty ??= {
      command: ["uvx", "ty", "server"],
      extensions: PYTHON,
    };
    config.lsp = lsp;
  },
  "experimental.chat.system.transform": async (_input: unknown, output: { system: string[] }) => {
    output.system.push(
      "For Python reads and edits, use Ty diagnostics as type feedback and run `uvx ty check` before completion when typing changed.",
    );
  },
});
