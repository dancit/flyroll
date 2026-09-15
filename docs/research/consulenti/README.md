# Ricerca sui consulenti del lavoro (Traccia A)

## Questionario tempi e costi paghe

Il questionario anonimo che valida le ipotesi del [modello di costo del cedolino](../../../learning/reference/modello-costo-cedolino.html) è un'app web in [`questionario/`](../../../questionario/README.md), pubblicata su Vercel: si condivide un link, i consulenti compilano anche da telefono, le risposte vengono salvate sul server e si scaricano dall'area riservata `/admin`.

Chiede: cedolini per addetto, ripartizione del tempo tra i 7 step, costo del personale e del software, prezzi per fascia di cliente, tempo del titolare, cause di rilavorazione. Alla fine mostra al consulente il costo per cedolino del suo studio accanto alla stima di riferimento.

Istruzioni per pubblicarlo, per leggere le risposte e sull'anonimato: [`questionario/README.md`](../../../questionario/README.md).

**Impegno preso con chi risponde:** le risposte si usano solo in forma aggregata.

La prima versione era un file HTML da mandare come allegato email; è stata sostituita dall'app web (un allegato da scaricare risulta sospetto). Resta nella storia del repository, commit `d5c8617`.
