type Entry = { command?: string[]; extensions?: string[] };
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
});
