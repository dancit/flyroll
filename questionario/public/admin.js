/* Area riservata: export e riepilogo delle risposte contro le ipotesi del modello. */
(function () {
  "use strict";

  var ORE_ANNO = 1700, MOLT = 1.37;
  var RAL = { "meno-26": 24000, "26-30": 28000, "30-34": 32000, "34-38": 36000, "oltre-38": 40000 };
  var RAL_ETICHETTE = { "meno-26": "Meno di 26.000 €", "26-30": "26.000-30.000 €", "30-34": "30.000-34.000 €", "34-38": "34.000-38.000 €", "oltre-38": "Oltre 38.000 €", "nd": "Non risponde" };
  var STEP = ["Raccolta presenze e variabili", "Eventi del mese", "Variazioni di anagrafica e contratto", "Calcolo del cedolino",
    "Controllo e quadratura", "Emissione e invii", "Domande di clienti e dipendenti", "Altro"];
  var CAUSE = { "dati-cliente": "Dati del cliente in ritardo o incompleti", "eventi-non-comunicati": "Eventi non comunicati",
    "interpretazione-ccnl": "Interpretazione del CCNL, rinnovi e arretrati", "scarti-flussi": "Errori o scarti nei flussi",
    "domande-dipendenti": "Richieste di chiarimento dei dipendenti", "rettifiche": "Correzioni dopo l'emissione", "software": "Limiti o errori del software" };

  var $ = function (id) { return document.getElementById(id); };
  var eur = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var uno = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
  var int = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });

  try { $("token").value = sessionStorage.getItem("questionario-token") || ""; } catch (e) { /* niente */ }
  function token() {
    var t = $("token").value.trim();
    try { sessionStorage.setItem("questionario-token", t); } catch (e) { /* niente */ }
    return t;
  }
  function messaggio(id, testo, errore) { var p = $(id); p.textContent = testo; p.classList.toggle("errore", !!errore); }

  function chiama(metodo, query) {
    return fetch("/api/risposte" + query, { method: metodo, headers: { Authorization: "Bearer " + token() } }).then(function (r) {
      if (r.status === 401) throw new Error("Token non valido.");
      if (r.status === 403) throw new Error("Area riservata non configurata: manca ADMIN_TOKEN su Vercel.");
      if (r.status === 503) throw new Error("Archivio non configurato: collegare Upstash Redis al progetto.");
      return r;
    });
  }

  /* --- export --- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-formato]"), function (b) {
    b.addEventListener("click", function () {
      var formato = b.getAttribute("data-formato");
      messaggio("esito", "Preparo il file…");
      chiama("GET", "?formato=" + formato).then(function (r) {
        if (!r.ok) throw new Error("Export non riuscito (" + r.status + ").");
        var nome = (/filename="([^"]+)"/.exec(r.headers.get("content-disposition") || "") || [])[1] || "risposte-questionario." + (formato === "json" ? "json" : "csv");
        return r.blob().then(function (blob) {
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = nome;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
          messaggio("esito", "Scaricato " + nome + ".");
        });
      }).catch(function (e) { messaggio("esito", e.message, true); });
    });
  });

  /* --- riepilogo --- */
  function mediana(valori) {
    var v = valori.filter(function (x) { return x !== null && x !== undefined && isFinite(x); }).sort(function (a, b) { return a - b; });
    if (!v.length) return null;
    var m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  }
  function cella(riga, testo, classe) { var td = document.createElement("td"); td.textContent = testo; if (classe) td.className = classe; riga.appendChild(td); }
  function aggiungi(tbody, celle) {
    var tr = document.createElement("tr");
    celle.forEach(function (c, i) { cella(tr, c, i ? "v" : ""); });
    tbody.appendChild(tr);
  }

  function minuti(r) {
    if (!r.ced_addetto) return null;
    var q = r.quota_paghe ? r.quota_paghe / 100 : 1;
    return ORE_ANNO * 60 * q / (r.ced_addetto * 12);
  }
  function personale(r) {
    var ral = RAL[r.ral_fascia];
    if (!ral || !r.ced_addetto) return null;
    var q = r.quota_paghe ? r.quota_paghe / 100 : 1;
    return ral * MOLT * q / (r.ced_addetto * 12);
  }
  function software(r) {
    if (r.sw_cedolino !== null && r.sw_cedolino !== undefined) return r.sw_cedolino;
    if (r.sw_annuo !== null && r.sw_annuo !== undefined && r.ced_studio) return r.sw_annuo / (r.ced_studio * 12);
    return null;
  }

  function riepilogo(risposte) {
    $("rie-n").textContent = risposte.length === 1 ? "1 risposta." : risposte.length + " risposte. Ogni riga dice su quante si basa la mediana.";

    var p = $("tab-parametri"); p.textContent = "";
    function parametro(nome, valori, fmt, modello) {
      var n = valori.filter(function (x) { return x !== null && x !== undefined && isFinite(x); }).length;
      var m = mediana(valori);
      aggiungi(p, [nome, m === null ? "—" : fmt(m), modello, String(n)]);
    }
    var f = { n: function (x) { return int.format(x); }, min: function (x) { return uno.format(x) + " min"; }, eur: function (x) { return eur.format(x) + " €"; }, ore: function (x) { return uno.format(x) + " h"; } };
    parametro("Cedolini al mese per addetto senior", risposte.map(function (r) { return r.ced_addetto; }), f.n, "300");
    parametro("Aziende seguite da un addetto", risposte.map(function (r) { return r.aziende_addetto; }), f.n, "—");
    parametro("Minuti dell'addetto per cedolino", risposte.map(minuti), f.min, "28,3 min");
    parametro("Personale per cedolino", risposte.map(personale), f.eur, "12,18 €");
    parametro("Software per cedolino", risposte.map(software), f.eur, "3,80 €");
    parametro("Costo diretto per cedolino", risposte.map(function (r) { var a = personale(r), b = software(r); return a !== null && b !== null ? a + b : null; }), f.eur, "15,98 €");
    parametro("Prezzo, micro (1-5 dip.)", risposte.map(function (r) { return r.prezzo_micro; }), f.eur, "10-25 €");
    parametro("Prezzo, piccola (6-15)", risposte.map(function (r) { return r.prezzo_piccola; }), f.eur, "10-25 €");
    parametro("Prezzo, media (16-50)", risposte.map(function (r) { return r.prezzo_media; }), f.eur, "10-25 €");
    parametro("Prezzo, oltre 50", risposte.map(function (r) { return r.prezzo_grande; }), f.eur, "10-25 €");
    parametro("Ore al mese del titolare sulle paghe", risposte.map(function (r) { return r.ore_titolare; }), f.ore, "non stimato");

    var s = $("tab-step"); s.textContent = "";
    STEP.forEach(function (nome, i) {
      var quote = [], min = [], conteggi = { software: 0, misto: 0, persona: 0 };
      risposte.forEach(function (r) {
        var st = r.step || [];
        var tot = st.reduce(function (a, x) { return a + (x && x.pct ? x.pct : 0); }, 0);
        var x = st[i] || {};
        if (tot > 0 && x.pct !== null && x.pct !== undefined) {
          var q = x.pct / tot * 100;
          quote.push(q);
          var m = minuti(r);
          if (m !== null) min.push(m * q / 100);
        }
        if (x.chi) conteggi[x.chi]++;
      });
      var mq = mediana(quote), mm = mediana(min);
      aggiungi(s, [nome, mq === null ? "—" : uno.format(mq) + "%", mm === null ? "—" : uno.format(mm) + " min",
        i < STEP.length - 1 ? conteggi.software + " · " + conteggi.misto + " · " + conteggi.persona : "—"]);
    });

    var ral = $("tab-ral"); ral.textContent = "";
    Object.keys(RAL_ETICHETTE).forEach(function (k) {
      var n = risposte.filter(function (r) { return r.ral_fascia === k; }).length;
      aggiungi(ral, [RAL_ETICHETTE[k], String(n)]);
    });

    var c = $("tab-cause"); c.textContent = "";
    Object.keys(CAUSE).map(function (k) {
      return [k, risposte.filter(function (r) { return (r.cause || []).indexOf(k) >= 0; }).length];
    }).sort(function (a, b) { return b[1] - a[1]; }).forEach(function (x) { aggiungi(c, [CAUSE[x[0]], String(x[1])]); });

    $("riepilogo").hidden = false;
  }

  $("accesso").addEventListener("submit", function (e) {
    e.preventDefault();
    messaggio("esito", "Carico le risposte…");
    chiama("GET", "?formato=json").then(function (r) {
      if (!r.ok) throw new Error("Lettura non riuscita (" + r.status + ").");
      return r.json();
    }).then(function (d) {
      messaggio("esito", "");
      riepilogo(d.risposte || []);
    }).catch(function (e) { messaggio("esito", e.message, true); });
  });

  /* --- eliminazione, con conferma in due tempi --- */
  var inAttesa = null;
  $("b-elimina").addEventListener("click", function () {
    var codice = $("codice").value.trim().toLowerCase();
    if (!/^[a-z0-9]{8}$/.test(codice)) { messaggio("esito-elimina", "Il codice è di 8 caratteri, lettere minuscole e cifre.", true); return; }
    if (inAttesa !== codice) {
      inAttesa = codice;
      $("b-elimina").textContent = "Conferma: elimina " + codice;
      messaggio("esito-elimina", "Prema di nuovo per confermare. L'eliminazione non si può annullare.");
      return;
    }
    inAttesa = null;
    $("b-elimina").textContent = "Elimina la risposta";
    chiama("DELETE", "?codice=" + encodeURIComponent(codice)).then(function (r) {
      if (r.status === 404) throw new Error("Nessuna risposta con il codice " + codice + ".");
      if (!r.ok) throw new Error("Eliminazione non riuscita (" + r.status + ").");
      messaggio("esito-elimina", "Risposta " + codice + " eliminata.");
    }).catch(function (e) { messaggio("esito-elimina", e.message, true); });
  });
  $("codice").addEventListener("input", function () { inAttesa = null; $("b-elimina").textContent = "Elimina la risposta"; });
})();
