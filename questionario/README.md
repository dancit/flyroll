# Questionario tempi e costi paghe

Il questionario anonimo per i consulenti del lavoro (Traccia A), pubblicato su Vercel: si condivide un link, le risposte vengono salvate sul server e si scaricano da un'area riservata. Valida le ipotesi del [modello di costo del cedolino](../learning/reference/modello-costo-cedolino.html).

```
public/          la pagina del questionario (index.html) e l'area riservata (admin.html)
api/risposte.js  la Vercel Function: salva, esporta, elimina
lib/             validazione (schema.js), archivio Upstash Redis (store.js), logica dell'endpoint (handler.js)
test/            test con un archivio finto in memoria
dev/locale.js    server locale per provare tutto senza Vercel
```

Nessuna dipendenza npm: l'archivio si usa tramite l'API REST di Upstash con `fetch`.

## Provarlo in locale

```bash
cd questionario
npm test          # 17 test su validazione e endpoint
npm run dev       # http://localhost:3000 ; area riservata su /admin con token "prova-admin"
```

Il server locale usa un archivio in memoria (si svuota a ogni riavvio) e applica le stesse intestazioni di sicurezza di `vercel.json`.

## Pubblicarlo su Vercel (una volta sola)

1. **Creare il progetto.** Su [vercel.com/new](https://vercel.com/new) importare il repository GitHub `dancit/flyroll` e impostare **Root Directory = `questionario`** (Framework Preset: *Other*). Ogni push su `main` ripubblica da solo.
   In alternativa, da terminale: `npx vercel login`, poi `cd questionario && npx vercel link`.
2. **Collegare l'archivio.** Nel progetto: *Storage* → *Upstash* (Redis) → piano gratuito, **regione Frankfurt (eu-central-1)** → collegarlo al progetto. Vercel inietta da solo le credenziali (il codice accetta sia `KV_REST_API_URL`/`KV_REST_API_TOKEN` sia `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`).
   Da terminale: `npx vercel install upstash`.
3. **Impostare il token dell'area riservata.** *Settings* → *Environment Variables* → `ADMIN_TOKEN` (ambiente Production) con un valore lungo e casuale, per esempio l'output di `openssl rand -hex 24`. Facoltativo: `RATE_SALT`, un altro valore casuale per il limite anti-abuso.
   Da terminale: `npx vercel env add ADMIN_TOKEN production`.
4. **Ripubblicare**, perché le variabili valgono solo dal deploy successivo: *Deployments* → *Redeploy*, oppure `npx vercel --prod`.
5. **Provare.** Aprire l'URL di produzione (`https://<progetto>.vercel.app`), inviare una risposta di prova e annotare il codice mostrato. Aprire `/admin`, inserire il token, controllare il riepilogo, poi eliminare la risposta di prova con il suo codice.

Se aprendo il link compare una schermata di login di Vercel, la protezione è attiva sul dominio usato: condividere il dominio di produzione, oppure disattivare *Vercel Authentication* in *Settings* → *Deployment Protection*.

## Cosa si salva, e cosa no

- Ogni risposta è un record JSON in un hash Redis, indicizzato da un codice casuale di 8 caratteri generato nel browser. Un reinvio dallo stesso browser sostituisce la risposta precedente.
- Si salva solo la **data** di invio, non l'ora. Nessun indirizzo IP, user agent o cookie finisce nell'archivio.
- Il limite anti-abuso (20 invii all'ora per rete) usa un'impronta SHA-256 dell'IP con sale, che scade dopo un'ora e non è collegata alle risposte. Un campo nascosto intercetta i bot: riceve «ok» ma non viene salvato.
- La funzione non scrive mai il corpo delle richieste nei log. Vercel conserva però per un periodo limitato i log delle richieste, che includono metadati come l'IP: la pagina promette l'anonimato delle risposte salvate, non dei log di piattaforma.
- Regione della funzione: `fra1` (Francoforte), impostata in `vercel.json`. Scegliere Francoforte anche per Upstash, così i dati restano in UE.

## Leggere le risposte

Da `/admin`, con il token:
- **Vedi il riepilogo:** numero di risposte e mediane dei parametri (cedolini per addetto, minuti e costo per cedolino, software, prezzi per fascia, ore del titolare) accanto ai valori del modello; quota e minuti mediani per attività, con i conteggi software/misto/persona; fasce di retribuzione; cause di rilavorazione.
- **Scarica CSV** (virgola, per Google Fogli o Python), **Scarica per Excel** (punto e virgola e decimali con la virgola) o **JSON**.
- **Elimina una risposta** dato il codice: per le prove, o su richiesta di chi l'ha data.

Lo stesso export è disponibile via API: `GET /api/risposte?formato=csv|excel|json` con `Authorization: Bearer <ADMIN_TOKEN>`.
