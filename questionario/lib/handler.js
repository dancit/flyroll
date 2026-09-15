// Logica dell'endpoint /api/risposte, separata dal file in api/ per poterla
// provare con un archivio finto (test e server locale).
//
//   POST    salva una risposta (pubblico, con limite di invii per ora)
//   GET     esporta le risposte: ?formato=csv (predefinito) | excel | json  — richiede ADMIN_TOKEN
//   DELETE  elimina una risposta: ?codice=xxxxxxxx                        — richiede ADMIN_TOKEN

import { createHash, timingSafeEqual } from "node:crypto";
import { valida, csv, CODICE } from "./schema.js";
import { configurazione, creaArchivio } from "./store.js";

const LIMITE_PER_ORA = 20;
const MAX_BYTE = 16000;

function json(corpo, stato = 200, extra = {}) {
  return new Response(JSON.stringify(corpo), {
    status: stato,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });
}

const sha = (s) => createHash("sha256").update(s).digest();

function autorizzato(request, env) {
  const atteso = env.ADMIN_TOKEN || "";
  const h = request.headers.get("authorization") || "";
  const dato = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!atteso || !dato) return false;
  return timingSafeEqual(sha(dato), sha(atteso));
}

function controllaAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return json({ errore: "Area riservata non configurata: manca ADMIN_TOKEN" }, 403);
  if (!autorizzato(request, env)) return json({ errore: "Non autorizzato" }, 401, { "WWW-Authenticate": "Bearer" });
  return null;
}

function indirizzo(request) {
  return (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip") || "ignoto";
}

async function invia(request, archivio, env, ora) {
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    return json({ errore: "Formato non supportato" }, 415);
  }
  const testo = await request.text();
  if (testo.length > MAX_BYTE) return json({ errore: "Risposta troppo lunga" }, 413);
  let corpo;
  try { corpo = JSON.parse(testo); } catch { return json({ errore: "Risposta non leggibile" }, 400); }

  // Limite anti-abuso: l'indirizzo IP non viene salvato, solo un'impronta con sale
  // che scade dopo un'ora e non è collegata alle risposte.
  const orario = ora();
  const impronta = sha(`${env.RATE_SALT || "questionario-paghe"}|${indirizzo(request)}`).toString("hex").slice(0, 32);
  const chiave = `questionario:v1:limite:${impronta}:${Math.floor(orario.getTime() / 3600000)}`;
  if ((await archivio.conta(chiave, 3600)) > LIMITE_PER_ORA) {
    return json({ errore: "Troppi invii in poco tempo: riprovi tra un'ora." }, 429);
  }

  let record;
  try {
    record = valida(corpo);
  } catch (e) {
    if (e && e.campo === "sito") return json({ ok: true }, 201); // trappola per i bot: risponde ok, non salva
    return json({ errore: "Risposta non valida", campo: e?.campo ?? null, dettaglio: e?.messaggio ?? null }, 400);
  }
  record.ricevuto = orario.toISOString().slice(0, 10); // solo il giorno: basta per l'analisi
  await archivio.salva(record);
  return json({ ok: true, codice: record.codice }, 201);
}

async function esporta(request, archivio, env, ora) {
  const negato = controllaAdmin(request, env);
  if (negato) return negato;
  const formato = new URL(request.url).searchParams.get("formato") || "csv";
  const record = await archivio.tutte();
  if (formato === "json") return json({ n: record.length, risposte: record });
  const excel = formato === "excel";
  const giorno = ora().toISOString().slice(0, 10);
  return new Response(csv(record, excel ? { separatore: ";", decimaleVirgola: true } : {}), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="risposte-questionario-${giorno}${excel ? "-excel" : ""}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

async function elimina(request, archivio, env) {
  const negato = controllaAdmin(request, env);
  if (negato) return negato;
  const codice = new URL(request.url).searchParams.get("codice") || "";
  if (!CODICE.test(codice)) return json({ errore: "Codice non valido" }, 400);
  const fatto = await archivio.elimina(codice);
  return json({ ok: fatto }, fatto ? 200 : 404);
}

export function crea({ env = process.env, fetchImpl, ora = () => new Date() } = {}) {
  return {
    async fetch(request) {
      const cfg = configurazione(env);
      if (!cfg) return json({ errore: "Archivio non configurato" }, 503);
      const archivio = creaArchivio(cfg, fetchImpl ?? globalThis.fetch);
      try {
        switch (request.method) {
          case "POST": return await invia(request, archivio, env, ora);
          case "GET": return await esporta(request, archivio, env, ora);
          case "DELETE": return await elimina(request, archivio, env);
          default: return json({ errore: "Metodo non ammesso" }, 405, { Allow: "GET, POST, DELETE" });
        }
      } catch (e) {
        console.error("questionario:", e?.message); // mai il corpo della richiesta nei log
        return json({ errore: "Archivio non raggiungibile, riprovi tra poco." }, 502);
      }
    },
  };
}
