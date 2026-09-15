import { test } from "node:test";
import assert from "node:assert/strict";
import { crea } from "../lib/handler.js";
import { creaRedisFinto, ENV_FINTO } from "./redis-finto.js";
import { BASE } from "./fixture.js";

const URL_API = "https://questionario.test/api/risposte";

function ambiente(env = ENV_FINTO) {
  const redis = creaRedisFinto();
  const h = crea({ env, fetchImpl: redis.fetchFinto, ora: () => new Date("2026-09-15T10:30:00Z") });
  const invia = (corpo, ip = "1.2.3.4", tipo = "application/json") =>
    h.fetch(new Request(URL_API, { method: "POST", headers: { "Content-Type": tipo, "x-forwarded-for": ip }, body: typeof corpo === "string" ? corpo : JSON.stringify(corpo) }));
  const admin = (metodo, query = "", token = ENV_FINTO.ADMIN_TOKEN) =>
    h.fetch(new Request(URL_API + query, { method: metodo, headers: token ? { Authorization: `Bearer ${token}` } : {} }));
  return { redis, invia, admin };
}

test("POST salva la risposta, senza IP, con la sola data", async () => {
  const { redis, invia } = ambiente();
  const r = await invia(BASE);
  assert.equal(r.status, 201);
  assert.deepEqual(await r.json(), { ok: true, codice: "abcd2345" });
  const salvato = JSON.parse(redis.hash.get("questionario:v1:risposte").get("abcd2345"));
  assert.equal(salvato.ricevuto, "2026-09-15");
  assert.equal(JSON.stringify(salvato).includes("1.2.3.4"), false);
});

test("un reinvio con lo stesso codice sostituisce la risposta", async () => {
  const { redis, invia } = ambiente();
  await invia(BASE);
  await invia({ ...BASE, ced_addetto: 450 });
  const h = redis.hash.get("questionario:v1:risposte");
  assert.equal(h.size, 1);
  assert.equal(JSON.parse(h.get("abcd2345")).ced_addetto, 450);
});

test("POST rifiuta corpo non JSON, formato sbagliato e valori non validi", async () => {
  const { invia } = ambiente();
  assert.equal((await invia("{rotto")).status, 400);
  assert.equal((await invia(BASE, "1.2.3.4", "text/plain")).status, 415);
  const r = await invia({ ...BASE, quota_paghe: 5 });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).campo, "quota_paghe");
  assert.equal((await invia("x".repeat(20000))).status, 413);
});

test("la trappola per bot risponde 201 ma non salva", async () => {
  const { redis, invia } = ambiente();
  const r = await invia({ ...BASE, sito: "spam" });
  assert.equal(r.status, 201);
  assert.equal(redis.hash.get("questionario:v1:risposte"), undefined);
});

test("limite di 20 invii all'ora per indirizzo", async () => {
  const { invia } = ambiente();
  for (let i = 0; i < 20; i++) assert.equal((await invia(BASE, "9.9.9.9")).status, 201);
  assert.equal((await invia(BASE, "9.9.9.9")).status, 429);
  assert.equal((await invia(BASE, "8.8.8.8")).status, 201); // un altro indirizzo non è toccato
});

test("GET esporta solo con il token giusto, in CSV, Excel e JSON", async () => {
  const { invia, admin } = ambiente();
  await invia(BASE);
  assert.equal((await admin("GET", "", null)).status, 401);
  assert.equal((await admin("GET", "", "sbagliato")).status, 401);
  const c = await admin("GET");
  assert.equal(c.status, 200);
  assert.match(c.headers.get("content-disposition"), /risposte-questionario-2026-09-15\.csv/);
  assert.ok((await c.text()).includes('"abcd2345"'));
  const x = await admin("GET", "?formato=excel");
  assert.ok((await x.text()).split("\r\n")[0].includes(";"));
  const j = await (await admin("GET", "?formato=json")).json();
  assert.equal(j.n, 1);
});

test("senza ADMIN_TOKEN l'area riservata è chiusa", async () => {
  const { admin } = ambiente({ ...ENV_FINTO, ADMIN_TOKEN: "" });
  assert.equal((await admin("GET", "", "qualsiasi")).status, 403);
});

test("DELETE elimina una risposta per codice", async () => {
  const { redis, invia, admin } = ambiente();
  await invia(BASE);
  assert.equal((await admin("DELETE", "?codice=abcd2345", null)).status, 401);
  assert.equal((await admin("DELETE", "?codice=ABC")).status, 400);
  assert.equal((await admin("DELETE", "?codice=abcd2345")).status, 200);
  assert.equal((await admin("DELETE", "?codice=abcd2345")).status, 404);
  assert.equal(redis.hash.get("questionario:v1:risposte").size, 0);
});

test("senza credenziali dell'archivio risponde 503; archivio giù risponde 502", async () => {
  const senza = crea({ env: {} });
  assert.equal((await senza.fetch(new Request(URL_API, { method: "POST" }))).status, 503);
  const giu = crea({ env: ENV_FINTO, fetchImpl: async () => new Response("boom", { status: 500 }) });
  const r = await giu.fetch(new Request(URL_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(BASE) }));
  assert.equal(r.status, 502);
});

test("variabili con la convenzione UPSTASH_REDIS_REST_*", async () => {
  const redis = creaRedisFinto();
  const h = crea({ env: { UPSTASH_REDIS_REST_URL: "https://finto.upstash.io/", UPSTASH_REDIS_REST_TOKEN: "segreto" }, fetchImpl: redis.fetchFinto });
  const r = await h.fetch(new Request(URL_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(BASE) }));
  assert.equal(r.status, 201);
});
