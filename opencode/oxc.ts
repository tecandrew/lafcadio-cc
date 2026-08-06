type Entry = { command?: string[]; extensions?: string[] };
type Config = {
  formatter?: boolean | Record<string, Entry>;
  lsp?: boolean | Record<string, Entry>;
};

const FORMAT = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts", ".vue", ".svelte"];
const LINT = [...FORMAT, ".astro"];
const entries = (value: Config["formatter"] | Config["lsp"]) =>
  value && typeof value === "object" ? value : {};

export const OxcPlugin = async () => ({
  config: async (config: Config) => {
    const formatter = entries(config.formatter);
    formatter.oxfmt ??= {
      command: ["bunx", "oxfmt", "$FILE"],
      extensions: FORMAT,
    };
    formatter["oxlint-fix"] ??= {
      command: ["bunx", "oxlint", "--fix", "$FILE"],
      extensions: LINT,
    };
    config.formatter = formatter;

    const lsp = entries(config.lsp);
    lsp.oxlint ??= {
      command: ["bunx", "oxlint", "--lsp"],
      extensions: LINT,
    };
    config.lsp = lsp;
  },
  "experimental.chat.system.transform": async (_input: unknown, output: { system: string[] }) => {
    output.system.push(
      "For JavaScript, TypeScript, Vue, Svelte, and Astro reads and edits, use Oxc diagnostics. Oxfmt and safe Oxlint fixes run automatically where supported; Astro is linted but not formatted.",
    );
  },
});
