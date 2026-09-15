// Archivio delle risposte su Upstash Redis, tramite la sua API REST:
// nessuna dipendenza, solo fetch. Le risposte stanno in un hash, una per codice,
// così un reinvio dallo stesso browser sostituisce la versione precedente.

const CHIAVE = "questionario:v1:risposte";

/** Legge le credenziali iniettate dall'integrazione Upstash di Vercel (entrambe le convenzioni di nome). */
export function configurazione(env = process.env) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

export function creaArchivio({ url, token }, f = globalThis.fetch) {
  async function pipeline(comandi) {
    const r = await f(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(comandi),
    });
    if (!r.ok) throw new Error(`archivio: HTTP ${r.status}`);
    const out = await r.json();
    if (!Array.isArray(out)) throw new Error("archivio: risposta inattesa");
    const errore = out.find((x) => x && x.error);
    if (errore) throw new Error(`archivio: ${errore.error}`);
    return out.map((x) => x.result);
  }

  return {
    async salva(record) {
      await pipeline([["HSET", CHIAVE, record.codice, JSON.stringify(record)]]);
    },

    async tutte() {
      const [piatto] = await pipeline([["HGETALL", CHIAVE]]);
      const record = [];
      for (let i = 1; i < (piatto || []).length; i += 2) {
        try { record.push(JSON.parse(piatto[i])); } catch { /* riga corrotta: la saltiamo */ }
      }
      return record.sort((a, b) => String(a.ricevuto).localeCompare(String(b.ricevuto)) || a.codice.localeCompare(b.codice));
    },

    async elimina(codice) {
      const [n] = await pipeline([["HDEL", CHIAVE, codice]]);
      return n > 0;
    },

    /** Contatore con scadenza: restituisce il valore dopo l'incremento. */
    async conta(chiave, secondi) {
      const [, n] = await pipeline([["SET", chiave, "0", "EX", String(secondi), "NX"], ["INCR", chiave]]);
      return n;
    },
  };
}
