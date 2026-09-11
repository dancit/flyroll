/* Esercizi del corso — widget con feedback immediato.
   Si attivano da soli su ogni elemento .q con data-tipo:

   scelta      <div class="q" data-tipo="scelta" data-giusta="b">
                 <p class="q-prompt">…</p>
                 <ol class="q-options"><li data-key="a" data-perche="…">…</li>…</ol>
                 <div class="q-spiega">spiegazione mostrata dopo la risposta</div>
               </div>

   classifica  <div class="q" data-tipo="classifica" data-categorie="umano,macchina,misto">
                 <p class="q-prompt">…</p>
                 <ul class="q-rows"><li data-giusta="macchina" data-perche="…">…</li>…</ul>
               </div>

   ordina      <div class="q" data-tipo="ordina">
                 <p class="q-prompt">…</p>
                 <ol class="q-rows"><li>primo</li><li>secondo</li>…</ol>   (ordine giusto = ordine nel sorgente)
               </div>

   richiamo    <div class="q" data-tipo="richiamo">
                 <p class="q-prompt">…</p>
                 <div class="q-modello">risposta modello</div>
               </div>

   Il punteggio conta solo il primo tentativo (è quello che misura la memoria).
   Un elemento .punteggio nella pagina mostra il totale. */

(function () {
  "use strict";

  var totale = { fatti: 0, giusti: 0, possibili: 0 };

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function mescola(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function aggiornaPunteggio() {
    var box = document.querySelector(".punteggio");
    if (!box) return;
    if (totale.fatti < totale.possibili) {
      box.textContent = "Risposte al primo colpo: " + totale.giusti + " su " + totale.fatti +
        " (mancano " + (totale.possibili - totale.fatti) + ").";
    } else {
      var r = totale.giusti / totale.possibili;
      var msg = r >= 0.85 ? "Solido. Ripassa tra qualche giorno senza rileggere la lezione."
              : r >= 0.6 ? "Buona base. Rileggi solo le spiegazioni degli errori, poi rifai gli esercizi domani."
              : "Normale al primo giro. Rileggi la tabella degli step e riprova domani: è la ripetizione distanziata che fissa.";
      box.textContent = "Risultato: " + totale.giusti + " su " + totale.possibili + " al primo colpo. " + msg;
    }
  }

  function segna(giusto) {
    totale.fatti++;
    if (giusto) totale.giusti++;
    aggiornaPunteggio();
  }

  function feedback(ok, html) {
    var f = el("div", { class: "q-feedback " + (ok ? "giusto" : "sbagliato"), role: "status" });
    f.innerHTML = "<strong>" + (ok ? "Giusto." : "Non proprio.") + "</strong> " + (html || "");
    return f;
  }

  /* ---------- scelta multipla ---------- */
  function scelta(q) {
    var giusta = q.dataset.giusta;
    var spiega = q.querySelector(".q-spiega");
    if (spiega) spiega.hidden = true;
    var lista = q.querySelector(".q-options");
    var voci = Array.prototype.slice.call(lista.children);
    totale.possibili++;
    var bottoni = [];
    voci.forEach(function (li) {
      var key = li.dataset.key;
      var b = el("button", { type: "button" });
      b.appendChild(el("span", { class: "key" }, key.toUpperCase()));
      var testo = el("span");
      testo.innerHTML = li.innerHTML;
      b.appendChild(testo);
      li.innerHTML = "";
      li.appendChild(b);
      bottoni.push(b);
      b.addEventListener("click", function () {
        var ok = key === giusta;
        bottoni.forEach(function (x) { x.disabled = true; });
        b.classList.add(ok ? "giusto" : "sbagliato");
        if (!ok) {
          voci.forEach(function (v, i) { if (v.dataset.key === giusta) bottoni[i].classList.add("giusto"); });
        }
        var perche = li.dataset.perche ? li.dataset.perche + " " : "";
        var fb = feedback(ok, perche + (spiega ? spiega.innerHTML : ""));
        q.appendChild(fb);
        segna(ok);
      });
    });
  }

  /* ---------- classificazione ---------- */
  var ETICHETTE = { umano: "Umano", macchina: "Macchina", misto: "Misto" };

  function classifica(q) {
    var cats = (q.dataset.categorie || "umano,macchina,misto").split(",");
    var righe = Array.prototype.slice.call(q.querySelectorAll(".q-rows > li"));
    totale.possibili += righe.length;
    righe.forEach(function (li) {
      var giusta = li.dataset.giusta;
      var testo = li.innerHTML;
      li.innerHTML = "";
      var label = el("span", { class: "label" });
      label.innerHTML = testo;
      var gruppo = el("span", { class: "cats", role: "group", "aria-label": "Chi fa questo lavoro?" });
      var bottoni = cats.map(function (c) {
        var b = el("button", { type: "button" }, ETICHETTE[c] || c);
        b.addEventListener("click", function () {
          var ok = c === giusta;
          bottoni.forEach(function (x) { x.disabled = true; });
          b.classList.add(ok ? "giusto" : "sbagliato");
          if (!ok) bottoni[cats.indexOf(giusta)].classList.add("giusto");
          var why = el("p", { class: "why", role: "status" });
          why.innerHTML = "<strong>" + (ok ? "Giusto: " : "È " + (ETICHETTE[giusta] || giusta).toLowerCase() + ": ") +
            "</strong>" + (li.dataset.perche || "");
          li.appendChild(why);
          segna(ok);
        });
        gruppo.appendChild(b);
        return b;
      });
      li.appendChild(label);
      li.appendChild(gruppo);
    });
  }

  /* ---------- ordinamento ---------- */
  function ordina(q) {
    var sorgente = q.querySelector(".q-rows");
    var giusto = Array.prototype.slice.call(sorgente.children).map(function (li) { return li.innerHTML; });
    sorgente.remove();
    totale.possibili++;
    var errori = 0;
    var costruita = el("ol", { class: "q-built", "aria-live": "polite" });
    var pool = el("ul", { class: "q-pool" });
    var stato = el("p", { class: "q-status", role: "status" }, "Tocca gli step nell'ordine in cui avvengono nel mese.");
    q.appendChild(costruita);
    q.appendChild(pool);
    q.appendChild(stato);
    mescola(giusto.map(function (h, i) { return i; })).forEach(function (i) {
      var li = el("li");
      var b = el("button", { type: "button" });
      b.innerHTML = giusto[i];
      b.addEventListener("click", function () {
        var atteso = costruita.children.length;
        if (i === atteso) {
          var done = el("li");
          done.innerHTML = giusto[i];
          costruita.appendChild(done);
          li.remove();
          if (costruita.children.length === giusto.length) {
            var ok = errori === 0;
            stato.textContent = ok ? "Sequenza completa, senza errori." :
              "Sequenza completa, con " + errori + (errori === 1 ? " errore." : " errori.");
            segna(ok);
          } else {
            stato.textContent = "Giusto. Qual è il prossimo?";
          }
        } else {
          errori++;
          b.classList.add("scossa");
          stato.textContent = "Non ancora: questo viene più avanti. Cosa deve succedere prima?";
          setTimeout(function () { b.classList.remove("scossa"); }, 900);
        }
      });
      li.appendChild(b);
      pool.appendChild(li);
    });
  }

  /* ---------- richiamo libero ---------- */
  function richiamo(q) {
    var modello = q.querySelector(".q-modello");
    modello.hidden = true;
    modello.classList.add("modello");
    totale.possibili++;
    var ta = el("textarea", { "aria-label": "La tua risposta", placeholder: "Scrivi da memoria, senza guardare sopra." });
    var azioni = el("div", { class: "q-actions" });
    var mostra = el("button", { type: "button" }, "Confronta con la risposta modello");
    azioni.appendChild(mostra);
    q.insertBefore(ta, modello);
    q.insertBefore(azioni, modello);
    mostra.addEventListener("click", function () {
      modello.hidden = false;
      mostra.disabled = true;
      azioni.innerHTML = "";
      var domanda = el("span", { class: "q-status" }, "Com'è andata? ");
      azioni.appendChild(domanda);
      [["Ce l'avevo", true], ["Solo in parte", false], ["Non ce l'avevo", false]].forEach(function (p) {
        var b = el("button", { type: "button" }, p[0]);
        b.addEventListener("click", function () {
          Array.prototype.forEach.call(azioni.querySelectorAll("button"), function (x) { x.disabled = true; });
          b.classList.add(p[1] ? "giusto" : "sbagliato");
          segna(p[1]);
        });
        azioni.appendChild(b);
      });
    });
  }

  var TIPI = { scelta: scelta, classifica: classifica, ordina: ordina, richiamo: richiamo };

  function avvia() {
    Array.prototype.forEach.call(document.querySelectorAll(".q[data-tipo]"), function (q) {
      var f = TIPI[q.dataset.tipo];
      if (f) f(q);
    });
    aggiornaPunteggio();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia);
  else avvia();
})();
