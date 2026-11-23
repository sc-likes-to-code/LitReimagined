/** Tiny CLI parsing: --flag, --key value, --key=value. */
export function parseArgs(argv = process.argv.slice(2)) {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const [k, v] = a.slice(2).split("=");
    if (v !== undefined) values.set(k, v);
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) values.set(k, argv[++i]);
    else flags.add(k);
  }
  return {
    has: (k: string) => flags.has(k) || values.has(k),
    get: (k: string) => values.get(k),
    num: (k: string) => (values.has(k) ? Number(values.get(k)) : undefined),
  };
}
