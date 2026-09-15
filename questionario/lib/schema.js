// Schema delle risposte al questionario: una sola definizione, usata dal server
// per validare e normalizzare, e dall'export per costruire le colonne del CSV.

export const VERSIONE = 1;

export const ENUM = {
  area: ["nord-ovest", "nord-est", "centro", "sud-isole"],
  software: ["zucchetti", "teamsystem", "sistemi", "inaz", "ranocchi", "centro-paghe", "altro"],
  chi: ["software", "misto", "persona"],
  ral_fascia: ["meno-26", "26-30", "30-34", "34-38", "oltre-38", "nd"],
  sw_formula: ["a-cedolino", "canone", "per-utente", "misto", "non-so"],
  prezzo_consulenza: ["si", "no", "dipende"],
  cause: [
    "dati-cliente", "eventi-non-comunicati", "interpretazione-ccnl",
    "scarti-flussi", "domande-dipendenti", "rettifiche", "software",
  ],
};

// [min, max, intero]: gli stessi limiti degli input della pagina.
export const NUMERI = {
  ced_studio: [1, 100000, true],
  addetti: [0.5, 500, false],
  aziende: [1, 20000, true],
  ced_addetto: [20, 3000, true],
  aziende_addetto: [1, 1000, true],
  quota_paghe: [10, 100, false],
  sw_annuo: [0, 2000000, false],
  sw_cedolino: [0, 50, false],
  prezzo_micro: [1, 200, false],
  prezzo_piccola: [1, 200, false],
  prezzo_media: [1, 200, false],
  prezzo_grande: [1, 200, false],
  ore_titolare: [0, 300, false],
};

export const N_STEP = 8; // 7 attività più "Altro"
const PCT = [0, 100, false];
const MAX_NOTA = 1500;
const MAX_SOFTWARE_ALTRO = 80;
export const CODICE = /^[a-z0-9]{8}$/;

function testo(v, max) {
  if (v == null) return null;
  if (typeof v !== "string") throw new Error("tipo non valido");
  // via i caratteri di controllo, spazi compattati
  const pulito = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (pulito.length > max) throw new Error("testo troppo lungo");
  return pulito || null;
}

function numero(v, [min, max, intero]) {
  if (v == null || v === "") return null;
  if (typeof v !== "number" || !Number.isFinite(v)) throw new Error("non è un numero");
  if (v < min || v > max) throw new Error(`fuori dall'intervallo ${min}-${max}`);
  if (intero && !Number.isInteger(v)) throw new Error("deve essere un numero intero");
  return v;
}

function scelta(v, valori) {
  if (v == null || v === "") return null;
  if (!valori.includes(v)) throw new Error("valore non ammesso");
  return v;
}

/**
 * Valida il corpo inviato dalla pagina e restituisce il record da salvare.
 * Lancia { campo, messaggio } al primo errore: la pagina applica gli stessi limiti,
 * quindi un errore qui significa una richiesta che non viene dalla pagina.
 */
export function valida(corpo) {
  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) throw { campo: null, messaggio: "corpo non valido" };
  const campo = (nome, fn) => {
    try { return fn(); } catch (e) { throw { campo: nome, messaggio: e.message }; }
  };

  if (corpo.sito) throw { campo: "sito", messaggio: "campo trappola compilato" };
  if (corpo.v !== VERSIONE) throw { campo: "v", messaggio: "versione del questionario non riconosciuta" };
  const codice = corpo.codice;
  if (typeof codice !== "string" || !CODICE.test(codice)) throw { campo: "codice", messaggio: "codice non valido" };

  const r = { v: VERSIONE, codice };
  r.area = campo("area", () => scelta(corpo.area, ENUM.area));
  r.software = campo("software", () => scelta(corpo.software, ENUM.software));
  r.software_altro = campo("software_altro", () => testo(corpo.software_altro, MAX_SOFTWARE_ALTRO));
  for (const [nome, lim] of Object.entries(NUMERI)) r[nome] = campo(nome, () => numero(corpo[nome], lim));
  r.ral_fascia = campo("ral_fascia", () => scelta(corpo.ral_fascia, ENUM.ral_fascia));
  r.sw_formula = campo("sw_formula", () => scelta(corpo.sw_formula, ENUM.sw_formula));
  r.prezzo_consulenza = campo("prezzo_consulenza", () => scelta(corpo.prezzo_consulenza, ENUM.prezzo_consulenza));

  const step = corpo.step ?? [];
  if (!Array.isArray(step) || step.length > N_STEP) throw { campo: "step", messaggio: "attività non valide" };
  r.step = Array.from({ length: N_STEP }, (_, i) => {
    const s = step[i] ?? {};
    return {
      chi: i < N_STEP - 1 ? campo(`step${i + 1}_chi`, () => scelta(s.chi, ENUM.chi)) : null,
      pct: campo(`step${i + 1}_pct`, () => numero(s.pct, PCT)),
    };
  });

  const cause = corpo.cause ?? [];
  if (!Array.isArray(cause) || cause.length > 3 || new Set(cause).size !== cause.length) {
    throw { campo: "cause", messaggio: "al massimo tre cause, senza ripetizioni" };
  }
  r.cause = cause.map((c) => campo("cause", () => scelta(c, ENUM.cause)));
  r.nota = campo("nota", () => testo(corpo.nota, MAX_NOTA));
  return r;
}

/** Colonne del CSV, nell'ordine del questionario. */
export const COLONNE = [
  "codice", "ricevuto", "area", "ced_studio", "addetti", "aziende", "software", "software_altro",
  "ced_addetto", "aziende_addetto", "quota_paghe",
  ...Array.from({ length: N_STEP }, (_, i) => (i < N_STEP - 1 ? [`step${i + 1}_chi`, `step${i + 1}_pct`] : [`step${i + 1}_pct`])).flat(),
  "ral_fascia", "sw_formula", "sw_annuo", "sw_cedolino",
  "prezzo_micro", "prezzo_piccola", "prezzo_media", "prezzo_grande", "prezzo_consulenza",
  "ore_titolare", "cause", "nota",
];

/** Appiattisce un record salvato in una riga { colonna: valore }. */
export function riga(rec) {
  const o = {};
  for (const c of COLONNE) o[c] = rec[c] ?? null;
  rec.step?.forEach((s, i) => {
    if (i < N_STEP - 1) o[`step${i + 1}_chi`] = s.chi;
    o[`step${i + 1}_pct`] = s.pct;
  });
  o.cause = rec.cause?.join("|") || null;
  return o;
}

/**
 * CSV con BOM, così Excel riconosce l'UTF-8.
 * Per Excel in italiano: { separatore: ";", decimaleVirgola: true }.
 */
export function csv(record, { separatore = ",", decimaleVirgola = false } = {}) {
  const cella = (v) => {
    if (v == null) return "";
    if (typeof v === "number") return decimaleVirgola ? String(v).replace(".", ",") : String(v);
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // niente formule quando si apre in un foglio di calcolo
    return `"${s.replace(/"/g, '""')}"`;
  };
  const righe = record.map(riga).map((o) => COLONNE.map((c) => cella(o[c])).join(separatore));
  return "\uFEFF" + [COLONNE.join(separatore), ...righe].join("\r\n") + "\r\n";
}
