// Helper to read env variables with fallback to supabase/.env for local dev
export function getEnv(key: string): string | null {
  try {
    const v = Deno.env.get(key);
    if (v) return v;
  } catch (e) {
    // Deno.env might be disallowed in some environments
  }
  try {
    const cwd = Deno.cwd();
    const path = `${cwd.replace(/\\/g, '/')}/supabase/.env`;
    const text = Deno.readTextFileSync(path);
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const sep = trimmed.indexOf('=');
      if (sep === -1) continue;
      const k = trimmed.slice(0, sep).trim();
      const val = trimmed.slice(sep + 1).trim().replace(/^\"|\"$/g, '');
      if (k === key) return val;
    }
  } catch (e) {
    // Ignore parse errors
  }
  return null;
}
