/* Questionario tempi e costi paghe: calcolo del confronto e invio al server. */
(function () {
  "use strict";

  var VERSIONE = 1;
  var CHIAVE = "questionario-paghe-v1";
  var ORE_ANNO = 1700, MOLT = 1.37;
  var RAL = { "meno-26": 24000, "26-30": 28000, "30-34": 32000, "34-38": 36000, "oltre-38": 40000 };
  var STEP = [
    ["Raccolta presenze e variabili", "Ore, straordinari, ferie, permessi, trasferte, premi"],
    ["Eventi del mese", "Malattia, maternità, infortunio"],
    ["Variazioni di anagrafica e contratto", "Assunzioni, cessazioni, livelli, rinnovi CCNL"],
    ["Calcolo del cedolino", "Lancio e sorveglianza dell'elaborazione"],
    ["Controllo e quadratura", "Confronto con il mese prima, anomalie, totali"],
    ["Emissione e invii", "Cedolino, LUL, F24, Uniemens"],
    ["Domande di clienti e dipendenti", "Spiegazioni sul netto, arretrati, ritardi"],
    ["Altro", "Formazione, gestione del software, archivio"]
  ];
  var CHI = [["software", "Software", "c-sw"], ["misto", "Misto", "c-mi"], ["persona", "Persona", "c-pe"]];
  var NUMERICI = ["ced_studio", "addetti", "aziende", "ced_addetto", "aziende_addetto", "quota_paghe", "sw_annuo",
    "sw_cedolino", "prezzo_micro", "prezzo_piccola", "prezzo_media", "prezzo_grande", "ore_titolare"];
  var INTERI = ["ced_studio", "aziende", "ced_addetto", "aziende_addetto"];
  var PREZZI = ["prezzo_micro", "prezzo_piccola", "prezzo_media", "prezzo_grande"];

  var form = document.getElementById("q");
  var eur = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var int = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });
  var uno = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
  var $ = function (id) { return document.getElementById(id); };

  function el(tag, cls, testo) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (testo != null) e.textContent = testo;
    return e;
  }

  /* --- righe degli step, costruite senza HTML inline --- */
  STEP.forEach(function (s, i) {
    var n = i + 1;
    var riga = el("div", "step-riga");
    riga.appendChild(el("span", "num", String(n)));
    var nome = el("span", "nome", s[0]);
    nome.appendChild(el("small", null, s[1]));
    riga.appendChild(nome);
    var chi = el("div", "chi");
    if (n < STEP.length) {
      chi.setAttribute("role", "radiogroup");
      chi.setAttribute("aria-label", "Chi fa il lavoro: " + s[0]);
      CHI.forEach(function (c) {
        var l = el("label", c[2]);
        var r = document.createElement("input");
        r.type = "radio"; r.name = "step" + n + "_chi"; r.value = c[0];
        l.appendChild(r);
        l.appendChild(document.createTextNode(" " + c[1]));
        chi.appendChild(l);
      });
    }
    riga.appendChild(chi);
    var pct = el("span", "pct");
    pct.appendChild(el("span", "pct-etichetta", "Quota del tempo"));
    var u = el("span", "unita");
    var inp = document.createElement("input");
    inp.type = "number"; inp.inputMode = "numeric"; inp.min = "0"; inp.max = "100"; inp.step = "5";
    inp.name = "step" + n + "_pct"; inp.setAttribute("aria-label", "Quota del tempo, " + s[0]);
    u.appendChild(inp);
    u.appendChild(el("span", null, "%"));
    pct.appendChild(u);
    riga.appendChild(pct);
    $("step-righe").appendChild(riga);
  });

  /* --- lettura --- */
  function num(nome) {
    var e = form.elements[nome];
    if (!e || e.value === "") return null;
    var v = parseFloat(String(e.value).replace(",", "."));
    return isFinite(v) ? v : null;
  }
  function scelta(nome) {
    var e = form.querySelector('input[name="' + nome + '"]:checked');
    return e ? e.value : "";
  }
  function cause() {
    return Array.prototype.map.call(form.querySelectorAll('input[name="cause"]:checked'), function (c) { return c.value; });
  }

  /* --- controlli di plausibilità: gli stessi limiti del server --- */
  function controlla() {
    var fuori = [];
    Array.prototype.forEach.call(form.querySelectorAll("input[type=number]"), function (e) {
      var v = num(e.name), min = parseFloat(e.min), max = parseFloat(e.max);
      var sbagliato = v !== null && ((isFinite(min) && v < min) || (isFinite(max) && v > max));
      e.classList.toggle("fuori", sbagliato);
      if (sbagliato) fuori.push(e);
      var a = form.querySelector('[data-avviso="' + e.name + '"]');
      if (a) a.textContent = sbagliato ? "Valore insolito: tra " + int.format(min) + " e " + int.format(max) + ". Lo ricontrolli." : "";
    });
    return fuori;
  }

  /* --- calcolo del confronto --- */
  function calcola() {
    var ced = num("ced_addetto");
    var quota = num("quota_paghe"); quota = quota === null ? 1 : Math.min(Math.max(quota, 0), 100) / 100;
    var ral = RAL[scelta("ral_fascia")] || null;
    var r = { ced: ced, min: null, pers: null, sw: null, dir: null, prezzo: null, resto: null, pareggio: null };
    if (ced) r.min = ORE_ANNO * 60 * quota / (ced * 12);
    if (ced && ral) r.pers = ral * MOLT * quota / (ced * 12);
    var swC = num("sw_cedolino"), swA = num("sw_annuo"), cs = num("ced_studio");
    if (swC !== null) r.sw = swC; else if (swA !== null && cs) r.sw = swA / (cs * 12);
    if (r.pers !== null && r.sw !== null) r.dir = r.pers + r.sw;
    var prezzi = PREZZI.map(num).filter(function (v) { return v !== null; });
    if (prezzi.length) r.prezzo = prezzi.reduce(function (a, b) { return a + b; }, 0) / prezzi.length;
    if (r.prezzo !== null && r.dir !== null) r.resto = r.prezzo - r.dir;
    if (r.prezzo !== null && r.sw !== null && ral) {
      var m = r.prezzo - r.sw;
      r.pareggio = m > 0 ? ral * MOLT * quota / (m * 12) : Infinity;
    }
    return r;
  }

  function mostra(r) {
    var testi = {
      ced: r.ced ? int.format(r.ced) : null,
      min: r.min !== null ? uno.format(r.min) + " min" : null,
      pers: r.pers !== null ? eur.format(r.pers) + " €" : null,
      sw: r.sw !== null ? eur.format(r.sw) + " €" : null,
      dir: r.dir !== null ? eur.format(r.dir) + " €" : null,
      prezzo: r.prezzo !== null ? eur.format(r.prezzo) + " €" : null,
      resto: r.resto !== null ? eur.format(r.resto) + " €" : null,
      pareggio: r.pareggio === null ? null : (isFinite(r.pareggio) ? int.format(Math.ceil(r.pareggio)) : "mai")
    };
    Array.prototype.forEach.call(document.querySelectorAll("[data-r]"), function (td) {
      var k = td.getAttribute("data-r"), t = testi[k];
      td.textContent = t === null ? "manca un dato" : t;
      td.classList.toggle("vuoto", t === null);
      td.classList.toggle("neg", k === "resto" && r.resto !== null && r.resto < 0);
    });

    var pct = STEP.map(function (s, i) { return num("step" + (i + 1) + "_pct") || 0; });
    var tot = pct.reduce(function (a, b) { return a + b; }, 0);
    var box = $("barre-step"), righe = $("barre-righe");
    if (r.min !== null && tot > 0) {
      var minuti = pct.map(function (p) { return r.min * p / tot; });
      var max = Math.max.apply(null, minuti) || 1;
      righe.textContent = "";
      STEP.forEach(function (s, i) {
        var chi = scelta("step" + (i + 1) + "_chi");
        var cls = chi === "software" ? "sw" : chi === "misto" ? "mi" : chi === "persona" ? "pe" : "";
        var riga = el("div", "riga");
        riga.appendChild(el("span", "etichetta", s[0]));
        var t = el("span", "traccia");
        var b = el("span", "barra " + cls);
        b.style.width = "calc(" + (minuti[i] / max * 100) + "% - 3.5rem)";
        t.appendChild(b);
        t.appendChild(el("span", "val", uno.format(minuti[i]) + " min"));
        riga.appendChild(t);
        righe.appendChild(riga);
      });
      box.hidden = false;
    } else {
      box.hidden = true;
    }

    var somma = $("somma");
    somma.textContent = tot === 0 ? "Totale: 0%" : tot === 100 ? "Totale: 100%. Perfetto." :
      "Totale: " + int.format(tot) + "%. " + (tot < 100 ? "Mancano " + int.format(100 - tot) + " punti." :
        "Ci sono " + int.format(tot - 100) + " punti in più: nel confronto le riportiamo a 100.");
    somma.className = "somma" + (tot === 100 ? " ok" : tot > 0 ? " ko" : "");
  }

  /* --- avanzamento --- */
  var DOMANDE = ["area", "ced_studio", "addetti", "aziende", "software", "ced_addetto", "aziende_addetto", "quota_paghe",
    "step1_chi", "step2_chi", "step3_chi", "step4_chi", "step5_chi", "step6_chi", "step7_chi", "quote",
    "ral_fascia", "sw_formula", "sw_costo", "prezzi", "prezzo_consulenza", "ore_titolare", "cause"];
  function risposto(k) {
    if (k === "quote") return STEP.some(function (s, i) { return num("step" + (i + 1) + "_pct") !== null; });
    if (k === "sw_costo") return num("sw_annuo") !== null || num("sw_cedolino") !== null;
    if (k === "prezzi") return PREZZI.some(function (n) { return num(n) !== null; });
    if (k === "cause") return cause().length > 0;
    if (form.querySelector('input[type=radio][name="' + k + '"]')) return scelta(k) !== "";
    var e = form.elements[k];
    return !!e && e.value !== "";
  }
  function avanzamento() {
    var fatte = DOMANDE.filter(risposto).length;
    $("avanz-testo").textContent = fatte === 0 ? "Nessuna risposta ancora" : "Ha risposto a " + fatte + " domande su " + DOMANDE.length;
    $("avanz-barra").style.width = (fatte / DOMANDE.length * 100) + "%";
    return fatte;
  }

  /* --- memoria locale (bozza) --- */
  function letto() { try { return JSON.parse(localStorage.getItem(CHIAVE) || "null"); } catch (e) { return null; } }
  function scrivi(d) { try { localStorage.setItem(CHIAVE, JSON.stringify(d)); } catch (e) { /* navigazione privata: pazienza */ } }
  function nuovoCodice() {
    var a = "abcdefghjkmnpqrstuvwxyz23456789", id = "", buf = new Uint32Array(8);
    (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(buf) : buf.forEach(function (_, i) { buf[i] = Math.random() * 1e9; });
    for (var i = 0; i < 8; i++) id += a[buf[i] % a.length];
    return id;
  }
  var stato = letto() || {};
  var ID = stato._id || nuovoCodice();

  function salva() {
    var d = { _id: ID, _inviato: stato._inviato || null };
    Array.prototype.forEach.call(form.elements, function (e) {
      if (!e.name || e.name === "sito") return;
      if (e.type === "radio") { if (e.checked) d[e.name] = e.value; }
      else if (e.type === "checkbox") { if (e.checked) (d[e.name] = d[e.name] || []).push(e.value); }
      else if (e.value !== "") d[e.name] = e.value;
    });
    stato = d;
    scrivi(d);
  }
  function ripristina() {
    Array.prototype.forEach.call(form.elements, function (e) {
      if (!e.name || !(e.name in stato)) return;
      if (e.type === "radio") e.checked = stato[e.name] === e.value;
      else if (e.type === "checkbox") e.checked = (stato[e.name] || []).indexOf(e.value) >= 0;
      else e.value = stato[e.name];
    });
    if (stato._inviato) {
      var p = $("gia-inviato");
      p.textContent = "Ha già inviato le risposte il " + new Date(stato._inviato).toLocaleDateString("it-IT") +
        ". Se le modifica, prema di nuovo «Invia le risposte»: la nuova versione sostituisce la precedente.";
      p.hidden = false;
      $("b-invia").textContent = "Invia di nuovo le risposte";
    }
  }

  /* --- dati da inviare --- */
  function datiRisposta() {
    var d = { v: VERSIONE, codice: ID, sito: form.elements.sito.value };
    d.area = scelta("area") || null;
    d.software = scelta("software") || null;
    d.software_altro = form.elements.software_altro.value.trim() || null;
    NUMERICI.forEach(function (n) {
      var v = num(n);
      d[n] = v !== null && INTERI.indexOf(n) >= 0 ? Math.round(v) : v;
    });
    d.step = STEP.map(function (s, i) {
      return { chi: i < STEP.length - 1 ? (scelta("step" + (i + 1) + "_chi") || null) : null, pct: num("step" + (i + 1) + "_pct") };
    });
    d.ral_fascia = scelta("ral_fascia") || null;
    d.sw_formula = scelta("sw_formula") || null;
    d.prezzo_consulenza = scelta("prezzo_consulenza") || null;
    d.cause = cause();
    d.nota = form.elements.nota.value.trim() || null;
    return d;
  }

  function testoRisposte() {
    var d = datiRisposta(), righe = ["Questionario tempi e costi paghe v" + VERSIONE, "codice: " + ID, ""];
    Object.keys(d).forEach(function (k) {
      if (k === "v" || k === "codice" || k === "sito") return;
      var v = d[k];
      if (k === "step") v = v.map(function (s, i) { return (i + 1) + "=" + (s.chi || "-") + " " + (s.pct === null ? "-" : s.pct + "%"); }).join("; ");
      if (Array.isArray(v)) v = v.join(", ");
      righe.push(k + ": " + (v === null || v === "" ? "-" : v));
    });
    return righe.join("\n");
  }

  /* --- aggiornamento --- */
  function aggiorna() {
    controlla();
    mostra(calcola());
    avanzamento();
    if (!$("riserva").hidden) $("testo").value = testoRisposte();
  }
  form.addEventListener("input", function () { aggiorna(); salva(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  $("cause").addEventListener("change", function (e) {
    var a = $("avviso-cause");
    if (cause().length > 3 && e.target.checked) { e.target.checked = false; a.textContent = "Al massimo tre cause."; }
    else a.textContent = "";
    aggiorna(); salva();
  });

  /* --- invio --- */
  var esito = $("esito"), bottone = $("b-invia");
  function messaggio(testo, errore) { esito.textContent = testo; esito.classList.toggle("errore", !!errore); }
  function mostraRiserva() { $("riserva").hidden = false; $("testo").value = testoRisposte(); }

  bottone.addEventListener("click", function () {
    var fuori = controlla();
    if (fuori.length) {
      messaggio("Ci sono " + fuori.length + (fuori.length === 1 ? " valore insolito" : " valori insoliti") + " da ricontrollare, evidenziati in rosso.", true);
      fuori[0].focus();
      return;
    }
    if (avanzamento() === 0) { messaggio("Risponda ad almeno una domanda prima di inviare.", true); return; }

    bottone.disabled = true;
    bottone.textContent = "Invio in corso…";
    messaggio("", false);
    fetch("/api/risposte", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datiRisposta()) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (corpo) { return { stato: r.status, corpo: corpo }; });
      })
      .then(function (x) {
        if (x.stato === 201) {
          stato._inviato = new Date().toISOString();
          salva();
          $("codice-mostrato").textContent = ID;
          $("grazie").hidden = false;
          $("riserva").hidden = true;
          $("gia-inviato").hidden = true;
          messaggio("", false);
          $("grazie").scrollIntoView({ block: "center" });
        } else if (x.stato === 429) {
          messaggio("Troppi invii in poco tempo da questa rete. Riprovi tra un'ora: le risposte restano salvate qui.", true);
        } else if (x.stato === 400) {
          messaggio("Il server non ha accettato una risposta" + (x.corpo.campo ? " (campo «" + x.corpo.campo + "»)" : "") + ". La ricontrolli e riprovi.", true);
          mostraRiserva();
        } else {
          messaggio("Invio non riuscito. Le risposte restano salvate in questo browser: riprovi tra qualche minuto.", true);
          mostraRiserva();
        }
      })
      .catch(function () {
        messaggio("Nessuna connessione. Le risposte restano salvate in questo browser: riprovi quando è di nuovo online.", true);
        mostraRiserva();
      })
      .then(function () {
        bottone.disabled = false;
        bottone.textContent = stato._inviato ? "Invia di nuovo le risposte" : "Invia le risposte";
      });
  });

  $("b-copia").addEventListener("click", function () {
    var testo = testoRisposte(), ta = $("testo");
    ta.value = testo;
    function aMano() {
      ta.closest("details").open = true; ta.focus(); ta.select();
      messaggio("Selezioni il testo qui sotto e lo copi a mano.", false);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(testo).then(function () { messaggio("Risposte copiate: le incolli in un messaggio a chi Le ha dato il link.", false); }, aMano);
    } else aMano();
  });

  $("b-cancella").addEventListener("click", function () {
    try { localStorage.removeItem(CHIAVE); } catch (e) { /* niente da cancellare */ }
    form.reset();
    stato = {};
    ID = nuovoCodice();
    $("grazie").hidden = true;
    $("riserva").hidden = true;
    $("gia-inviato").hidden = true;
    bottone.textContent = "Invia le risposte";
    aggiorna();
    messaggio("Risposte cancellate da questo browser. Quelle già inviate restano nell'indagine, in forma anonima.", false);
  });

  ripristina();
  aggiorna();
})();
