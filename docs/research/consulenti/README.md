# Ricerca sui consulenti del lavoro (Traccia A)

## Questionario tempi e costi paghe

`questionario-tempi-costi-paghe.html` è un questionario anonimo che valida le ipotesi del [modello di costo del cedolino](../../../learning/reference/modello-costo-cedolino.html): cedolini per addetto, ripartizione del tempo tra gli step, costo del personale e del software, prezzi per fascia di cliente, tempo del titolare, cause di rilavorazione.

**Come si usa**
1. Si invia il file come allegato email. Si apre in qualsiasi browser, senza account e senza connessione: la pagina non carica nulla da internet.
2. Il consulente compila (circa 10 minuti; tutte le domande sono facoltative) e alla fine vede il costo per cedolino del suo studio accanto alla stima di riferimento.
3. Scarica il file `risposte-questionario-paghe-<codice>.txt`, oppure copia il testo, e risponde all'email.

**Le risposte** sono righe `chiave: valore` con un codice casuale di 8 caratteri che distingue le risposte senza identificare chi le ha date. Le chiavi corrispondono ai parametri del modello (`ced_addetto`, `step1`…`step8`, `ral_fascia`, `sw_annuo`, `prezzo_micro`…). Salvare i file in `risposte/` in questa cartella per aggregarli.

**Ipotesi fisse nel calcolo mostrato al consulente:** 1.700 ore lavorate l'anno, costo dello studio = 1,37 × RAL, RAL al centro della fascia scelta, prezzo medio come media semplice delle fasce indicate.

**Anonimato:** il questionario non chiede nome, studio o dati dei lavoratori, ma chi riceve l'email vede il mittente. Nell'analisi le risposte vanno usate solo in forma aggregata, senza collegarle a chi le ha inviate, come promesso nella pagina.
