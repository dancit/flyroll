# Note del docente

## Preferenze dell'utente
- Lingua: italiano.
- Durata lezioni: non fissa — l'utente decide volta per volta. Tenere le lezioni corte di default, con un "approfondimento opzionale" in coda.
- Segmento: PMI prima, domestico dopo.
- L'utente verifica la provenienza dei numeri (2026-09-11, sul "budget di 5 minuti"). In ogni lezione distinguere sempre **dato con fonte**, **ipotesi di progetto** e **mia derivazione**; mai presentare un'ipotesi dell'ideazione come decisione presa.
- Traguardi scelti (2026-09-11): *stimare i costi per step* e *valutare i competitor*. **Non** scelto: specificare il motore, parlare alla pari con i CdL (quest'ultimo arriverà comunque come effetto collaterale).

## Design del corso (componenti in `assets/`)
- Linguaggio visivo: il tabulato paghe su modulo continuo (righe a bande verdi) e il timbro d'ufficio. Il colore codifica **solo** chi fa lo step: verde modulo = macchina, viola timbro = umano, split = misto. Non usare il viola o il verde per altro.
- Il `.timbro` si usa una volta per lezione, sulla tesi. Le citazioni vanno in note a margine (`.sn-ref` + `.sn`).
- `esercizi.js`: tipi `scelta`, `classifica`, `ordina`, `richiamo`; conta solo il primo tentativo. Nelle scelte multiple: stesso numero di parole per opzione, e la giusta non deve essere la più lunga.
- `.barre`: grafico a barre a una serie, valori diretti. Colori validati con lo script dataviz (il grigio neutro "fallisce" il chroma floor per scelta: è contesto, non una categoria).
- Verifica visiva: Chrome for Testing di Playwright in `~/Library/Caches/ms-playwright/chromium-1243/`. Headless ha una larghezza minima: per il mobile renderizzare dentro un iframe da 390px.

## Contesto di progetto
- Il workspace vive in `learning/` dentro il repo flyroll, per non sporcare `docs/` (le regole del NEXT-STEPS vogliono che ogni traccia scriva solo nella propria directory).
- Il grounding di mercato è in `docs/ideation/2026-07-14-payroll-service-ai-native-italia-ideation.md`: non rifare quella ricerca, riusarla e citarla.
- La metrica nord del progetto è *minuti-consulente per pratica*; il budget di riferimento è 5 minuti umani per rapporto per anno (102.000 min/anno ÷ 20.000 rapporti). Ogni lezione dovrebbe riagganciarsi a questa aritmetica.
