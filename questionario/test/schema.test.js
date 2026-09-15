import { test } from "node:test";
import assert from "node:assert/strict";
import { valida, csv, COLONNE } from "../lib/schema.js";
import { BASE } from "./fixture.js";


const errore = (corpo) => { try { valida(corpo); return null; } catch (e) { return e; } };

test("una risposta completa passa e viene normalizzata", () => {
  const r = valida(BASE);
  assert.equal(r.codice, "abcd2345");
  assert.equal(r.step.length, 8);
  assert.equal(r.step[7].chi, null);
  assert.equal(r.nota, "Pesa molto la gestione dei part-time - e i cambi turno"); // tolto il carattere di controllo, trattini intatti
  assert.equal("sito" in r, false);
});

test("una risposta vuota con solo codice è accettata", () => {
  const r = valida({ v: 1, codice: "zzzz2222" });
  assert.equal(r.ced_addetto, null);
  assert.deepEqual(r.cause, []);
  assert.equal(r.step.every((s) => s.chi === null && s.pct === null), true);
});

test("rifiuta valori fuori intervallo, non interi o non ammessi", () => {
  assert.equal(errore({ ...BASE, ced_addetto: 5 }).campo, "ced_addetto");
  assert.equal(errore({ ...BASE, ced_studio: 900.5 }).campo, "ced_studio");
  assert.equal(errore({ ...BASE, area: "estero" }).campo, "area");
  assert.equal(errore({ ...BASE, prezzo_micro: "25" }).campo, "prezzo_micro");
  assert.equal(errore({ ...BASE, step: [{ chi: "robot", pct: 10 }] }).campo, "step1_chi");
  assert.equal(errore({ ...BASE, step: [{ chi: "misto", pct: 120 }] }).campo, "step1_pct");
});

test("al massimo tre cause, senza ripetizioni", () => {
  assert.equal(errore({ ...BASE, cause: ["dati-cliente", "software", "rettifiche", "scarti-flussi"] }).campo, "cause");
  assert.equal(errore({ ...BASE, cause: ["software", "software"] }).campo, "cause");
});

test("codice, versione e trappola", () => {
  assert.equal(errore({ ...BASE, codice: "ABC" }).campo, "codice");
  assert.equal(errore({ ...BASE, v: 2 }).campo, "v");
  assert.equal(errore({ ...BASE, sito: "http://spam" }).campo, "sito");
  assert.equal(errore({ ...BASE, nota: "x".repeat(1501) }).campo, "nota");
});

test("CSV: intestazione, BOM, virgolette e niente formule", () => {
  const rec = { ...valida({ ...BASE, nota: '=SOMMA(A1) "citata"' }), ricevuto: "2026-09-15" };
  const out = csv([rec]);
  assert.ok(out.startsWith("\uFEFF" + COLONNE.join(",")));
  assert.ok(out.includes(`"'=SOMMA(A1) ""citata"""`));
  assert.ok(out.includes('"dati-cliente|interpretazione-ccnl"'));
});

test("CSV per Excel: punto e virgola e decimali con la virgola", () => {
  const rec = { ...valida({ ...BASE, addetti: 2.5 }), ricevuto: "2026-09-15" };
  const riga = csv([rec], { separatore: ";", decimaleVirgola: true }).split("\r\n")[1];
  assert.ok(riga.includes(";2,5;"));
});
