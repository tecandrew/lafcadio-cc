type Entry = { command?: string[]; extensions?: string[] };
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
});
