/* Modello di costo del cedolino — calcolatore.
   Legge i campi <input name="…"> dentro .calcolatore, scrive i risultati
   negli elementi [data-out="…"] e disegna la ripartizione in [data-ripartizione].

   Campi attesi (tutti numerici):
     ced      cedolini al mese per addetto
     minuti   minuti lavorati all'anno per persona
     ral      RAL dell'addetto (€)
     molt     moltiplicatore RAL → costo azienda
     sw       software per cedolino oggi (€)
     prezzo   prezzo di mercato per cedolino (€)
     secF     secondi umani per cedolino con Flyroll
     euroMin  costo al minuto del consulente (€)
     swF      software e agenti per cedolino con Flyroll (€) */

(function () {
  "use strict";

  var eur = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var int = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 });
  var uno = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
  var pct = function (x) { return int.format(x * 100) + "%"; };

  function leggi(form) {
    var v = {};
    Array.prototype.forEach.call(form.querySelectorAll("input[name]"), function (i) {
      var n = parseFloat(String(i.value).replace(",", "."));
      v[i.name] = isFinite(n) ? n : 0;
    });
    return v;
  }

  function calcola(v) {
    var cedAnno = v.ced * 12;
    var costoAz = v.ral * v.molt;
    var pers = cedAnno > 0 ? costoAz / cedAnno : 0;
    var dir = pers + v.sw;
    var persF = (v.secF / 60) * v.euroMin;
    var dirF = persF + v.swF;
    var margUnit = v.prezzo - v.sw;
    return {
      costoAz: costoAz,
      minCed: cedAnno > 0 ? v.minuti / cedAnno : 0,
      euroMinAddetto: v.minuti > 0 ? costoAz / v.minuti : 0,
      pers: pers, sw: v.sw, dir: dir,
      quotaPers: dir > 0 ? pers / dir : 0,
      resto: v.prezzo - dir,
      pareggio: margUnit > 0 ? costoAz / (margUnit * 12) : Infinity,
      persF: persF, swF: v.swF, dirF: dirF,
      quotaPersF: dirF > 0 ? persF / dirF : 0,
      restoF: v.prezzo - dirF,
      compressione: v.secF > 0 && cedAnno > 0 ? (v.minuti / cedAnno) / (v.secF / 60) : 0,
      prezzo: v.prezzo
    };
  }

  function scrivi(root, r) {
    var out = {
      costoAz: int.format(r.costoAz) + " €",
      minCed: uno.format(r.minCed) + " min",
      euroMinAddetto: eur.format(r.euroMinAddetto) + " €",
      pers: eur.format(r.pers) + " €",
      sw: eur.format(r.sw) + " €",
      dir: eur.format(r.dir) + " €",
      quota: pct(r.quotaPers) + " personale, " + pct(1 - r.quotaPers) + " software",
      resto: eur.format(r.resto) + " €",
      pareggio: isFinite(r.pareggio) ? int.format(Math.ceil(r.pareggio)) + " al mese" : "mai: il software da solo supera il prezzo",
      persF: eur.format(r.persF) + " €",
      dirF: eur.format(r.dirF) + " €",
      quotaF: pct(r.quotaPersF) + " personale, " + pct(1 - r.quotaPersF) + " software",
      restoF: eur.format(r.restoF) + " €",
      compressione: int.format(r.compressione) + " volte"
    };
    Array.prototype.forEach.call(root.querySelectorAll("[data-out]"), function (el) {
      var k = el.getAttribute("data-out");
      if (k in out) el.textContent = out[k];
      if (k === "resto" || k === "restoF") el.classList.toggle("negativo", (k === "resto" ? r.resto : r.restoF) < 0);
    });
  }

  function seg(cls, valore, scala, titolo) {
    var s = document.createElement("span");
    s.className = "rip-seg " + cls;
    s.style.flex = "0 0 " + Math.max(0, valore / scala * 100) + "%";
    s.title = titolo + ": " + eur.format(valore) + " €";
    if (valore / scala > 0.09) s.textContent = eur.format(valore);
    return s;
  }

  function riga(nome, sotto, pers, sw, prezzo, scala) {
    var r = document.createElement("div");
    r.className = "rip-riga";
    var n = document.createElement("span");
    n.className = "rip-nome";
    n.innerHTML = nome + "<small>" + sotto + "</small>";
    var b = document.createElement("span");
    b.className = "rip-barra";
    var dir = pers + sw;
    b.setAttribute("role", "img");
    b.setAttribute("aria-label", nome + ": personale " + eur.format(pers) + " €, software " + eur.format(sw) +
      " €, prezzo " + eur.format(prezzo) + " €, " + (prezzo >= dir ? "restano " : "perdita di ") + eur.format(Math.abs(prezzo - dir)) + " €");
    b.appendChild(seg("pers", pers, scala, "Personale"));
    b.appendChild(seg("sw", sw, scala, "Software"));
    if (prezzo > dir) b.appendChild(seg("resto", prezzo - dir, scala, "Resta per consulente, struttura e margine"));
    var m = document.createElement("span");
    m.className = "rip-prezzo";
    m.style.left = "calc(" + (prezzo / scala * 100) + "% - 1px)";
    m.title = "Prezzo: " + eur.format(prezzo) + " €";
    b.appendChild(m);
    var e = document.createElement("span");
    e.className = "rip-esito";
    e.innerHTML = prezzo >= dir
      ? "Restano <strong>" + eur.format(prezzo - dir) + " €</strong> su " + eur.format(prezzo) + " € (" + pct((prezzo - dir) / prezzo) + ")"
      : "<span class=\"perdita\">Perdita di " + eur.format(dir - prezzo) + " €</span> a cedolino, su un prezzo di " + eur.format(prezzo) + " €";
    r.appendChild(n); r.appendChild(b); r.appendChild(e);
    return r;
  }

  function disegna(box, r) {
    var scala = Math.max(r.prezzo, r.dir, r.dirF) * 1.04 || 1;
    box.innerHTML = "";
    box.appendChild(riga("Studio oggi", "addetto + software", r.pers, r.sw, r.prezzo, scala));
    box.appendChild(riga("Flyroll", "ipotesi dei secondi umani", r.persF, r.swF, r.prezzo, scala));
  }

  function avvia() {
    Array.prototype.forEach.call(document.querySelectorAll(".calcolatore"), function (form) {
      var root = form.closest("[data-modello]") || document;
      var box = root.querySelector("[data-ripartizione]");
      var predef = {};
      Array.prototype.forEach.call(form.querySelectorAll("input[name]"), function (i) { predef[i.name] = i.value; });
      function aggiorna() {
        var r = calcola(leggi(form));
        scrivi(root, r);
        if (box) disegna(box, r);
      }
      form.addEventListener("input", aggiorna);
      form.addEventListener("submit", function (e) { e.preventDefault(); });
      Array.prototype.forEach.call(form.querySelectorAll("[data-prezzo]"), function (btn) {
        btn.addEventListener("click", function () {
          form.querySelector("input[name=prezzo]").value = btn.getAttribute("data-prezzo");
          aggiorna();
        });
      });
      var reset = form.querySelector("[data-ripristina]");
      if (reset) reset.addEventListener("click", function () {
        Object.keys(predef).forEach(function (k) { form.querySelector("input[name=" + k + "]").value = predef[k]; });
        aggiorna();
      });
      aggiorna();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia);
  else avvia();
})();
