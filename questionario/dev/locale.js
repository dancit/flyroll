// Server locale per provare il questionario senza Vercel e senza Upstash:
//   npm run dev   →   http://localhost:3000   (area riservata: /admin, token "prova-admin")
// Usa lo stesso handler della Vercel Function, con un archivio finto in memoria.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { crea } from "../lib/handler.js";
import { creaRedisFinto, ENV_FINTO } from "../test/redis-finto.js";

const radice = fileURLToPath(new URL("../public/", import.meta.url));
// Le stesse intestazioni di sicurezza di vercel.json, così la CSP si prova anche in locale.
const sicurezza = Object.fromEntries(
  JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8")).headers[0].headers.map((h) => [h.key, h.value])
);
const tipi = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };
const api = crea({ env: ENV_FINTO, fetchImpl: creaRedisFinto().fetchFinto });
const porta = Number(process.env.PORT || 3000);

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${porta}`);
  if (url.pathname === "/api/risposte") {
    const pezzi = [];
    for await (const p of req) pezzi.push(p);
    const r = await api.fetch(new Request(url, {
      method: req.method,
      headers: { ...req.headers, "x-forwarded-for": req.socket.remoteAddress || "" },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(pezzi),
    }));
    res.writeHead(r.status, { ...sicurezza, ...Object.fromEntries(r.headers) });
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  let percorso = url.pathname === "/" ? "/index.html" : url.pathname;
  if (!extname(percorso)) percorso += ".html"; // come cleanUrls su Vercel
  const file = normalize(join(radice, percorso));
  if (!file.startsWith(radice)) { res.writeHead(403).end(); return; }
  try {
    const corpo = await readFile(file);
    res.writeHead(200, { ...sicurezza, "Content-Type": tipi[extname(file)] || "application/octet-stream" });
    res.end(corpo);
  } catch {
    res.writeHead(404).end("Non trovato");
  }
}).listen(porta, () => console.log(`Questionario su http://localhost:${porta}  ·  area riservata /admin (token: ${ENV_FINTO.ADMIN_TOKEN})`));
