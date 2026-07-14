# Next steps — dall'ideazione alla decisione

**Stato al 14/07/2026:** ideazione completata ([documento](2026-07-14-payroll-service-ai-native-italia-ideation.md) · [versione commentabile su Proof](https://www.proofeditor.ai/d/ftkwgjkd?token=5b9b582e-a51a-4d57-ad09-1b9edb614302)). **Nessuna idea è stata scelta e nessuna è stata validata sul campo.** Le confidenze nel documento sono stime dell'analisi desk, non evidenza.

Questo file esiste perché due persone possano lavorare in parallelo senza aspettarsi a vicenda e senza collidere sugli stessi file.

---

## Il punto di partenza in una pagina

Tre risultati dell'ideazione condizionano tutto il resto:

1. **Il vincolo "0 dipendenti + 1 consulente del lavoro + agenti AI" non è neutrale rispetto al mercato.** È rispettato in modo pulito **solo** se i clienti sono i consulenti del lavoro e noi siamo il loro back-office (CED ex L. 12/1979). In ogni altra configurazione quel vincolo è una scommessa legale, non un modello.
2. **Il segmento PMI è occupato** (Jet HR, €41,7M raccolti) e **ha già espulso un unicorno** (PayFit, entrata nel 2020 e uscita nel 2021/22). Non si entra frontalmente.
3. **Il segmento domestico è libero ma ha un ARPU da fame** (50-180€/anno) e un concorrente statale potenziale (il CESU francese è gratuito; l'Italia valuta riforme analoghe). Il payroll domestico è il *sensore*, non il prodotto.

Le sette idee sopravvissute si aggregano in **tre architetture mutuamente esclusive** (§ "Le tre architetture" nel documento di ideazione). **La decisione su quale perseguire non va presa a tavolino: va presa dopo i test qui sotto.**

---

## Le tre tracce di lavoro (parallelizzabili)

Ogni traccia ha un owner, un output, un criterio di kill e una directory dedicata. **Non scrivere fuori dalla tua directory** finché non arriviamo al gate.

### Traccia A — Il canale professionale (architettura PMI: idee 1 + 5)

**Owner:** _______
**Directory:** `docs/research/legale/` e `docs/research/consulenti/`
**Domanda che chiude:** possiamo essere un CED agentico legale, e i consulenti del lavoro ci comprerebbero?

**Cosa fare:**
1. **Parere legale (bloccante, prima di tutto il resto).** Portare l'architettura CED a un penalista d'impresa e, separatamente, a un ex consigliere del CNO Consulenti del Lavoro. Domanda testuale: *"dov'è esattamente il punto in cui questo diventa esercizio abusivo della professione ex art. 348 c.p.?"* Non chiedere "è legale?" — chiedere dove si rompe. Verificare in particolare: contenuto minimo dell'incarico scritto a data certa; se il nostro consulente interno può essere anche socio; se l'uso di agenti AI sull'attività meccanico-esecutiva è compatibile con le linee guida CNO 2025/26.
2. **Test di vendita (5 consulenti del lavoro).** Mettere davanti a cinque titolari di micro-studio una bozza di contratto di incarico CED con SLA e prezzo a cedolino processato (6-8€ su un cedolino che loro fatturano 35-40€). Metrica: **quanti firmano senza chiamare l'avvocato.** Non chiedere "ti interesserebbe?" — mettere il contratto sul tavolo.
3. **Mappare il lock-in.** Quale gestionale usano (Zucchetti, TeamSystem, Sistemi, Inaz)? Cosa costerebbe loro migrare o affiancare? È qui che l'idea muore o vive.

**Criterio di kill:** se il parere legale dice che il CED agentico è riqualificabile *anche con incarico scritto e supervisione reale*, l'architettura A è morta e il vincolo "0 dipendenti + 1 CdL" va rinegoziato. Se nessuno dei 5 consulenti mostra interesse economico dopo aver visto il margine (da 5€ a 30€ per cedolino), il canale non esiste.

---

### Traccia B — Il campo domestico (architetture B e C: idee 2, 3, 4, 6)

**Owner:** _______
**Directory:** `docs/research/domestico/`
**Domanda che chiude:** chi è davvero disposto a pagare, e attraverso quale canale?

**Cosa fare:**
1. **10-15 colloqui con lavoratrici domestiche (metà in regola, metà in nero).** Domande: *"cosa faresti per avere il contratto regolare, e cosa te lo impedisce oggi?"* e *"quanto ti costa mandare 300€ a casa, e quanto tempo ci metti?"*
   - **Il test che decide l'idea 2:** se il blocco è "il datore non vuole" → esiste una leva enorme e la lavoratrice è il canale di acquisizione. Se il blocco è "preferisco il netto" → **l'idea 2 muore lì**, ed è meglio saperlo in due settimane che in due anni.
   - Canali per trovarle: parrocchie ortodosse rumene, comunità filippine e peruviane, corsi OSS, money transfer, gruppi WhatsApp/Facebook per nazionalità.
2. **3-5 conversazioni con i canali abilitati** (patronato, CAF, Assindatcolf/Fidaldo, un'agenzia locale di badanti). Domanda: *"il nostro motore vi fa fare 4x le pratiche colf con lo stesso personale — o avete già un gestionale?"* Serve capire se sono un canale o un muro.
3. **8-10 colloqui con figli-caregiver (45-60 anni).** Il test dell'idea 6 e del pricing: *"preferisci pagare 1.100€/mese ed essere datore di lavoro, o 1.400€/mese e non essere niente?"* E: *"pagheresti 150€/mese per una garanzia di sostituzione in 24h, sapendo che oggi paghi 0?"*
4. **Solo se l'idea 6 sopravvive:** capire quanto del delta 20-25€/h (cooperative) vs 9-11€/h (badante privata sotto CCNL domestico) è overhead di coordinamento azzerabile dagli agenti. Se il delta non si chiude, l'idea 6 muore.

**Criterio di kill:** se le lavoratrici dicono "preferisco il netto" e i figli-caregiver non pagano oltre i 50-100€/anno per nessuna variante, l'intero segmento domestico è un hobby e va lasciato ai competitor a 50€.

---

### Traccia C — Il motore (idea 5, serve a prescindere dall'architettura scelta)

**Owner:** _______
**Directory:** `experiments/motore/`
**Domanda che chiude:** i minuti umani per pratica scendono davvero?

Questa traccia **si può iniziare subito e in parallelo**, perché il motore serve in tutte e tre le architetture, e perché il lavoro domestico è il banco di prova più pulito che esista in Italia: niente Libro Unico, niente Uniemens, contributi trimestrali, un solo CCNL. È il dominio rule-based ideale su cui misurare l'automazione prima di toccare i 900 CCNL della PMI.

**Cosa fare:**
1. **Prototipo agentico end-to-end su un caso domestico reale:** dalla foto del quaderno delle ore (il datore ha 69,9 anni di media — non userà mai una dashboard) fino a comunicazione INPS, calcolo contributi trimestrali, prospetto paga, Cassa Colf. Nessuna API REST pubblica esiste: UNILAV è XML, F24/CU passano da Entratel con delega. L'integrazione è lavoro di agenti su interfacce pensate per umani.
2. **Strumentare la metrica nord dal giorno 1: minuti-consulente per pratica.** Va in dashboard come un burn rate, non in un foglio Excel a fine mese.
   - Aritmetica di riferimento: un consulente lavora ~102.000 minuti/anno. Per gestire 20.000 rapporti il budget è **5 minuti umani per rapporto per anno.** È un vincolo di capienza, non un obiettivo di efficienza.
3. **Registro degli scostamenti** (è insieme prodotto, difesa legale e dataset): ogni volta che l'umano modifica la proposta dell'agente si scrive input, proposta della macchina, decisione umana, motivazione, timestamp, firma. Ogni eccezione deve chiudersi con un **artefatto eseguibile** (una regola, un test, un caso versionato), mai con una risposta monouso.

**Criterio di kill (il più importante del progetto):** se la curva dei minuti-consulente per pratica non scende tra la decima, la centesima e la millesima pratica, siamo Bench.co — che è fallita con 100M$ raccolti e 35.000 clienti proprio per questo. **Regola di governance: non si apre una nuova coorte di clienti se i minuti marginali della coorte precedente non sono scesi.**

---

## Il gate di decisione

**Quando:** dopo che A e B hanno prodotto i loro output, e C ha una prima curva di minuti-per-pratica (stima: 3-4 settimane).

**Cosa si decide:** quale delle tre architetture perseguire. Non prima — le tre sono mutuamente esclusive e sceglierne una a tavolino significa scommettere invece di validare.

**Output del gate:** un documento in `docs/decisions/` (formato ADR, breve) che dice quale architettura, perché, e cosa abbiamo scartato. Da scrivere **insieme**, non in parallelo.

---

## Regole di ingaggio (per non collidere)

- **Ogni traccia scrive solo nella propria directory.** `docs/ideation/` è congelato: se emerge qualcosa che contraddice l'ideazione, non riscriverla — apri una nota nella tua directory e portala al gate.
- **Un branch per traccia** (`ricerca/legale`, `ricerca/domestico`, `motore/prototipo`). Merge su `main` a fine traccia, non in continuo.
- **Le evidenze si citano.** Ogni claim che finisce in un documento di ricerca porta la fonte: nome dell'intervistato (o codice se riservato), data, e cosa ha detto testualmente. Le stime senza fonte non entrano nel gate.
- **Scrivi anche i risultati negativi.** Un "no" secco da un consulente del lavoro o da una badante vale più di tre "forse": è ciò che uccide un'idea in due settimane invece che in due anni.

---

## Come usare Claude Code su questo repo

- Per **approfondire una singola idea** prima di testarla: `/ce-brainstorm` citando l'idea (es. *"brainstorm sull'idea 1, il CED agentico"*). Serve a definire con precisione chi è il cliente, cosa vende esattamente, e come si testa.
- Per **passare all'implementazione** una volta scelta un'architettura: `/ce-plan` (dopo il brainstorm, non prima — il piano vuole requisiti già definiti).
- Per **rigenerare o estendere l'ideazione** con nuovi vincoli emersi dal campo: `/ce-ideate` con il nuovo vincolo come focus.
- Il documento di ideazione contiene tutto il grounding con le fonti: **non rifare la ricerca di mercato da zero.** Se un dato ti sembra sbagliato, verifica quello specifico e correggi con una nota, non ripartendo daccapo.
