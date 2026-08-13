type Entry = { disabled?: boolean; command?: string[]; extensions?: string[] };
type Config = {
  formatter?: boolean | Record<string, Entry>;
  lsp?: boolean | Record<string, Entry>;
};

const PYTHON = [".py", ".pyi"];
const entries = (value: Config["formatter"] | Config["lsp"]) =>
  value && typeof value === "object" ? value : {};

export const RuffPlugin = async () => ({
  config: async (config: Config) => {
    const formatter = entries(config.formatter);
    formatter.ruff ??= {
      command: ["uvx", "ruff", "format", "$FILE"],
      extensions: PYTHON,
    };
    if (!formatter.ruff.disabled) {
      formatter["ruff-fix"] ??= {
        command: ["uvx", "ruff", "check", "--fix", "$FILE"],
        extensions: PYTHON,
      };
    }
    config.formatter = formatter;

    const lsp = entries(config.lsp);
    lsp.ruff ??= {
      command: ["uvx", "ruff", "server", "--color", "never"],
      extensions: PYTHON,
    };
    config.lsp = lsp;
  },
});
