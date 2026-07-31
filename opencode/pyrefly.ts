type Entry = { disabled?: boolean; command?: string[]; extensions?: string[] };
type Config = { lsp?: boolean | Record<string, Entry> };

const PYTHON = [".py", ".pyi"];

export const PyreflyPlugin = async () => ({
  config: async (config: Config) => {
    const lsp = config.lsp && typeof config.lsp === "object" ? config.lsp : {};
    lsp.pyrefly ??= {
      command: ["uvx", "pyrefly", "lsp", "--color", "never"],
      extensions: PYTHON,
    };
    config.lsp = lsp;
  },
  "experimental.chat.system.transform": async (_input: unknown, output: { system: string[] }) => {
    output.system.push(
      "For Python reads and edits, use Pyrefly diagnostics as type feedback and run `uvx pyrefly check` before completion when typing changed.",
    );
  },
});
