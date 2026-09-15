// Un Upstash finto in memoria: risponde a /pipeline con i pochi comandi che usiamo.
// Serve ai test e al server locale (dev/locale.js).

export function creaRedisFinto() {
  const hash = new Map();
  const valori = new Map();
  const esegui = ([cmd, ...a]) => {
    switch (cmd) {
      case "HSET": { const h = hash.get(a[0]) ?? new Map(); const nuovo = !h.has(a[1]); h.set(a[1], a[2]); hash.set(a[0], h); return nuovo ? 1 : 0; }
      case "HGETALL": return [...(hash.get(a[0]) ?? new Map())].flat();
      case "HDEL": { const h = hash.get(a[0]); return h && h.delete(a[1]) ? 1 : 0; }
      case "SET": { if (a.includes("NX") && valori.has(a[0])) return null; valori.set(a[0], a[1]); return "OK"; }
      case "INCR": { const n = Number(valori.get(a[0]) ?? 0) + 1; valori.set(a[0], String(n)); return n; }
      default: throw new Error("comando non supportato: " + cmd);
    }
  };
  const fetchFinto = async (url, init) => {
    if (!String(url).endsWith("/pipeline")) return new Response("not found", { status: 404 });
    if (init?.headers?.Authorization !== "Bearer segreto") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const comandi = JSON.parse(init.body);
    return new Response(JSON.stringify(comandi.map((c) => ({ result: esegui(c) }))), { status: 200 });
  };
  return { fetchFinto, hash, valori };
}

export const ENV_FINTO = { KV_REST_API_URL: "https://finto.upstash.io", KV_REST_API_TOKEN: "segreto", ADMIN_TOKEN: "prova-admin" };
