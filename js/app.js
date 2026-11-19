// Kyokushin Karate – övvizsga-felkészítő weboldal
(function () {
  "use strict";

  var A = window.ADATOK;
  var E = window.EGYESULET || { szervezet: "Kyokushin Karate", leiras: "", klubok: [], linkek: [] };
  var M = window.MEDIA || {};
  var KAT = ["Állás", "Ütés", "Védés", "Rúgás", "Légzés"];
  var TABOK = [["", "Vizsga"], ["technika", "Technika"], ["kata", "Kata"], ["szavak", "Szavak"], ["elmelet", "Elmélet"]];
  var tartalom = document.getElementById("tartalom");

  // ------------------------------------------------------------------
  // Segédfüggvények
  // ------------------------------------------------------------------

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function sor(s) { return esc(s).replace(/\n/g, "<br>"); }
  function kever(l) {
    var a = l.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function egyedi(l, kulcs) {
    var lat = {}, o = [];
    l.forEach(function (x) { var k = kulcs(x); if (!lat[k]) { lat[k] = 1; o.push(x); } });
    return o;
  }

  var tar = {
    get: function (k, d) { try { var v = localStorage.getItem("kyo_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("kyo_" + k, JSON.stringify(v)); } catch (e) { /* nincs tárhely */ } }
  };

  function ovByStufe(n) { return A.ovek[n]; }
  function celOv() { var s = tar.get("cel", -1); return s >= 0 && s < A.ovek.length ? A.ovek[s] : null; }

  var uzenetIdo = null;
  function uzenet(s) {
    var t = document.getElementById("uzenet");
    t.textContent = s;
    t.classList.add("lathato");
    clearTimeout(uzenetIdo);
    uzenetIdo = setTimeout(function () { t.classList.remove("lathato"); }, 3500);
  }

  // ------------------------------------------------------------------
  // Kiejtés és japán hangosítás
  // ------------------------------------------------------------------

  function kiejtes(r) {
    var s = String(r).toLowerCase();
    s = s.replace(/tsu/g, "\u0004u").replace(/ts/g, "\u0004");
    s = s.replace(/sh/g, "\u0001").replace(/ch/g, "\u0002").replace(/j/g, "\u0003");
    s = s.replace(/s/g, "sz");
    s = s.replace(/\u0001/g, "s").replace(/\u0002/g, "cs").replace(/\u0003/g, "dzs").replace(/\u0004/g, "c");
    return s.replace(/y/g, "j").replace(/w/g, "v");
  }

  var SZOTAG = (function () {
    var m = {}, v = "aiueo";
    [["", "あいうえお"], ["k", "かきくけこ"], ["s", "さしすせそ"], ["t", "たちつてと"], ["n", "なにぬねの"],
      ["h", "はひふへほ"], ["m", "まみむめも"], ["r", "らりるれろ"], ["g", "がぎぐげご"], ["z", "ざじずぜぞ"],
      ["d", "だぢづでど"], ["b", "ばびぶべぼ"], ["p", "ぱぴぷぺぽ"]].forEach(function (r) {
      for (var i = 0; i < 5; i++) m[r[0] + v[i]] = r[1][i];
    });
    m.ya = "や"; m.yu = "ゆ"; m.yo = "よ"; m.wa = "わ"; m.wo = "を";
    m.shi = "し"; m.chi = "ち"; m.tsu = "つ"; m.fu = "ふ"; m.ji = "じ"; m.di = "じ"; m.du = "ず";
    var y = { k: "き", g: "ぎ", n: "に", h: "ひ", m: "み", r: "り", b: "び", p: "ぴ" };
    Object.keys(y).forEach(function (k) { m[k + "ya"] = y[k] + "ゃ"; m[k + "yu"] = y[k] + "ゅ"; m[k + "yo"] = y[k] + "ょ"; });
    m.sha = "しゃ"; m.shu = "しゅ"; m.sho = "しょ"; m.she = "しぇ";
    m.cha = "ちゃ"; m.chu = "ちゅ"; m.cho = "ちょ"; m.che = "ちぇ";
    m.ja = "じゃ"; m.ju = "じゅ"; m.jo = "じょ"; m.je = "じぇ";
    return m;
  })();

  function szoKana(w) {
    if (A.kanaKivetelek[w]) return A.kanaKivetelek[w];
    var o = "", i = 0;
    while (i < w.length) {
      var c = w[i];
      if (c === "n" && (i + 1 >= w.length || "aiueoy".indexOf(w[i + 1]) < 0)) { o += "ん"; i++; continue; }
      if (i + 1 < w.length && "aiueon".indexOf(c) < 0 && (w[i + 1] === c || (c === "t" && w[i + 1] === "c"))) { o += "っ"; i++; continue; }
      var talalt = false;
      for (var len = 3; len >= 1; len--) {
        var k = SZOTAG[w.substr(i, len)];
        if (i + len <= w.length && k) { o += k; i += len; talalt = true; break; }
      }
      if (!talalt) i++;
    }
    return o;
  }
  function kana(r) {
    var t = String(r).toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^a-z]+/g, " ").trim();
    if (!t) return "";
    return t.split(" ").filter(Boolean).map(szoKana).join(" ");
  }

  var beszed = "speechSynthesis" in window ? window.speechSynthesis : null;
  var hangok = [];
  function hangokBetolt() { if (beszed) hangok = beszed.getVoices() || []; }
  if (beszed) { hangokBetolt(); beszed.onvoiceschanged = hangokBetolt; }
  function hang(nyelv) {
    if (!hangok.length) hangokBetolt();
    for (var i = 0; i < hangok.length; i++) if (hangok[i].lang && hangok[i].lang.toLowerCase().indexOf(nyelv) === 0) return hangok[i];
    return null;
  }
  var japanFigyelmeztetes = false;

  /** Japán kifejezés kimondása: saját felvétel → japán hang → magyar hang az átírással. */
  function mond(id, romaji) {
    var m = M[String(id).toLowerCase()];
    if (m && m.hang) {
      try { if (beszed) beszed.cancel(); new Audio(m.hang).play().catch(function () {}); } catch (e) { /* */ }
      return;
    }
    if (!beszed) { uzenet("Ez a böngésző nem tud felolvasni."); return; }
    beszed.cancel();
    var ja = hang("ja"), u;
    if (ja) {
      u = new SpeechSynthesisUtterance(kana(romaji));
      u.voice = ja; u.lang = ja.lang; u.rate = 0.8;
    } else {
      var hu = hang("hu");
      u = new SpeechSynthesisUtterance(kiejtes(romaji));
      if (hu) { u.voice = hu; u.lang = hu.lang; } else u.lang = "hu-HU";
      u.rate = 0.9;
      if (!japanFigyelmeztetes) {
        japanFigyelmeztetes = true;
        uzenet("Nincs japán hang a készüléken – a magyar átírást olvasom fel. Pontos kiejtéshez telepítsd a japán felolvasó hangot.");
      }
    }
    beszed.speak(u);
  }

  /** Magyar szöveg felolvasása; újabb érintés = leállítás. */
  function felolvas(szoveg) {
    if (!beszed) { uzenet("Ez a böngésző nem tud felolvasni."); return; }
    if (beszed.speaking) { beszed.cancel(); return; }
    var u = new SpeechSynthesisUtterance(szoveg);
    var hu = hang("hu");
    if (hu) u.voice = hu;
    u.lang = hu ? hu.lang : "hu-HU";
    beszed.speak(u);
  }

  // ------------------------------------------------------------------
  // Építőkockák (HTML)
  // ------------------------------------------------------------------

  var SZORO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';

  function hangGomb(id, romaji, meret) {
    return '<button class="hanggomb' + (meret ? " " + meret : "") + '" data-act="mond" data-id="' + esc(id) + '" data-r="' + esc(romaji) + '" aria-label="Kiejtés meghallgatása">' + SZORO + "</button>";
  }
  function felolvasGomb(szoveg) {
    return '<button class="hanggomb kicsi" data-act="felolvas" data-t="' + esc(szoveg) + '" aria-label="Szöveg felolvasása">' + SZORO + "</button>";
  }
  function ovMinta(o, osztaly) {
    var csik = o.csik !== o.szin ? '<span style="background:' + o.csik + '"></span>' : "";
    return '<span class="ovminta ' + (osztaly || "") + (o.szin === "#FFFFFF" ? " feher" : "") + '" style="background:' + o.szin + '">' + csik + "</span>";
  }
  function kopf(cim, alcim, jobb) {
    return '<section class="kopf"><div class="kopf-sor"><div class="kopf-cim"><h1>' + esc(cim) + "</h1>" +
      (alcim ? "<p>" + esc(alcim) + "</p>" : "") + "</div>" + (jobb || "") + '</div><div class="piros-vonal"></div></section>';
  }
  function abschnitt(s, piros) { return '<div class="abschnitt' + (piros ? " piros" : "") + '">' + esc(s) + "</div>"; }
  function leer(s) { return '<div class="kartya halvany"><p>' + esc(s) + "</p></div>"; }

  function bejegyzes(japan, magyar, id, link, extra) {
    var bel = '<div class="bej-szoveg"><div class="bej-jp">' + esc(japan) + '</div><div class="kiejt">[' + esc(kiejtes(japan)) + "]</div>" +
      '<div class="bej-hu">' + esc(magyar) + "</div>" + (extra ? '<div class="bej-extra">' + esc(extra) + "</div>" : "") + "</div>";
    var nyil = link ? '<span class="nyil">›</span>' : "";
    var tartalmi = link ? '<a class="bej-link" href="#' + link + '">' + bel + nyil + "</a>" : '<div class="bej-link">' + bel + "</div>";
    return '<div class="bejegyzes">' + tartalmi + hangGomb(id, japan) + "</div>";
  }

  function media(id) {
    var m = M[String(id).toLowerCase()] || {};
    var h = "";
    if (m.kep) h += '<img class="media-kep" src="' + esc(m.kep) + '" alt="" loading="lazy">';
    if (m.video) h += '<video class="media-video" src="' + esc(m.video) + '" controls preload="metadata" playsinline></video>';
    if (!h) {
      var n = String(id).toLowerCase();
      h = '<div class="helyorzo"><strong>Kép / videó hamarosan</strong><span>Kép: kepek/' + n + '.jpg · Videó: videok/' + n + ".mp4<br>(felvétel: js/media.js)</span></div>";
    }
    return '<div class="media">' + h + "</div>";
  }

  // ------------------------------------------------------------------
  // 1) Főoldal
  // ------------------------------------------------------------------

  function idopontok(t) {
    var cs = {}, sorrend = [];
    (t.edzesek || []).forEach(function (e) { if (!cs[e.ido]) { cs[e.ido] = []; sorrend.push(e.ido); } cs[e.ido].push(e.nap); });
    return sorrend.map(function (i) { return cs[i].join(", ") + (i ? " " + i : ""); }).join(" · ");
  }

  function fooldal() {
    var cel = celOv();
    var bal = window.LOGO_BAL ? '<img class="logo bal" src="' + esc(window.LOGO_BAL) + '" alt="">' : "";
    var jobb = window.LOGO_JOBB ? '<img class="logo jobb" src="' + esc(window.LOGO_JOBB) + '" alt="">' : "";
    var h = '<section class="hero"><div class="hero-sor">' + bal + '<div class="hero-cim"><h1>Kyokushin Karate</h1><p class="hero-al">Övvizsga-felkészítő</p></div>' + jobb + "</div>" +
      '<div class="piros-vonal kozep"></div><div class="osu">Osu!</div><div class="ertekek">' +
      ["Kitartás", "Tisztelet", "Alázat", "Fegyelem", "Bátorság"].map(function (w) { return "<span>" + w + "</span>"; }).join("") + "</div></section>";

    h += '<div class="doboz">';
    var info;
    if (cel) {
      var kat = A.katak.filter(function (k) { return k.stufe === cel.stufe; }).map(function (k) { return k.nev; }).join(", ");
      info = (kat ? "Kata: " + kat + " · " : "") + szazalek(cel) + " % kész";
    }
    h += '<a class="cel-kartya" href="#' + (cel ? "utam" : "ovek") + '"><span class="cel-csik" style="background:' + (cel ? (cel.szin === "#FFFFFF" ? "#C9C9CE" : cel.szin) : "var(--piros)") + '"></span>' +
      '<span class="cel-szoveg">' + abschnitt("Célom") + "<strong>" + (cel ? esc(cel.fokozat + " · " + cel.nev) : "Még nincs cél kiválasztva") + "</strong>" +
      "<small>" + (cel ? esc(info) : "Válaszd ki, melyik övvizsgára készülsz.") + '</small></span><span class="cel-gomb">' + (cel ? "Megnyit" : "Választ") + "</span></a>";

    var csempek = [
      ["ovek", "Övek", "Vizsgaanyag", "sotet"],
      ["kartyak", "Szókártyák", "Kifejezések gyakorlása", ""],
      ["vezenyszavak", "Vezényszavak", "Hallgasd és reagálj", ""],
      ["egyesulet", "Egyesület", "Edzések és kapcsolat", "piros"],
      ["dojokun", "Dojo Kun", "A kyokushin eskü", "sotet"],
      ["kviz", "Kvíz", "Teszteld a tudásod", ""]
    ];
    h += '<div class="csempek">' + csempek.map(function (c) {
      return '<a class="csempe ' + c[3] + '" href="#' + c[0] + '"><span class="jel"></span><strong>' + c[1] + "</strong><small>" + c[2] + "</small></a>";
    }).join("");
    (E.linkek || []).forEach(function (l) {
      h += '<a class="csempe kulso" href="' + esc(l.url) + '" target="_blank" rel="noopener"><span class="jel"></span><strong>' + esc(l.nev) + ' ↗</strong><small>' + esc(l.leiras || "") + "</small></a>";
    });
    h += "</div>";

    h += '<p class="labjegy">Felkészülést segítő oldal. Mérvadó mindig a szövetség aktuális vizsgaszabályzata és az edződ útmutatása.</p></div>';
    return h;
  }

  // ------------------------------------------------------------------
  // 2) Övek
  // ------------------------------------------------------------------

  function ovekOldal() {
    var cel = celOv();
    var h = kopf("Övek", "Válaszd ki az övet, amelyre készülsz.") + '<div class="doboz"><div class="racs">';
    A.ovek.forEach(function (o) {
      var ez = cel && cel.stufe === o.stufe;
      var kat = A.katak.filter(function (k) { return k.stufe === o.stufe; }).map(function (k) { return k.nev; });
      var info = o.stufe === 0 ? "Kezdő" : (kat.length ? kat.join(", ") : "Kihon");
      h += '<a class="ov-sor' + (ez ? " aktiv" : "") + '" href="#ov-' + o.stufe + '">' + ovMinta(o) +
        '<span class="ov-szoveg"><strong>' + esc(o.nev) + "</strong><small>" + esc(o.fokozat + " · " + info) + "</small></span>" +
        (ez ? '<span class="cimke">Célom</span>' : "") + '<span class="nyil">›</span></a>';
    });
    return h + "</div></div>";
  }

  // ------------------------------------------------------------------
  // 3) Öv-oldal fülekkel
  // ------------------------------------------------------------------

  function ovOldal(n, tab) {
    var o = ovByStufe(n);
    var h = '<section class="kopf"><div class="kopf-sor"><div class="kopf-cim"><h1>' + esc(o.fokozat) + "</h1><p>" +
      esc(o.nev + (o.varakozas ? " · várakozási idő: " + o.varakozas : "")) + "</p></div>" + ovMinta(o, "nagy") + "</div>" +
      '<nav class="fulek">' + TABOK.map(function (t) {
        return '<a href="#ov-' + n + (t[0] ? "-" + t[0] : "") + '"' + (t[0] === tab ? ' class="aktiv"' : "") + ">" + t[1] + "</a>";
      }).join("") + "</nav></section><div class=\"doboz\">";

    if (tab === "") h += vizsgaTab(o);
    else if (tab === "technika") h += technikaTab(o);
    else if (tab === "kata") h += kataTab(o);
    else if (tab === "szavak") h += szoTab(o);
    else h += elmeletTab(o);

    if (o.stufe > 0) h += '<a class="fogomb" href="#kviz-' + o.stufe + '">Kvíz · ' + esc(o.fokozat) + "</a>";
    return h + "</div>";
  }

  function celKapcsolo(o) {
    var ez = celOv() && celOv().stufe === o.stufe;
    return '<button class="cel-kapcsolo' + (ez ? " aktiv" : "") + '" data-act="cel" data-n="' + o.stufe + '"><span><strong>' +
      (ez ? "Ez a célom" : "Legyen ez a célom") + "</strong><small>" + (ez ? "Ellenőrzőlista: Az utam" : "Megjelenik a főoldalon") +
      "</small></span><b>" + (ez ? "✓" : "+") + "</b></button>";
  }

  function vizsgaTab(o) {
    var h = celKapcsolo(o) + '<div class="racs">';
    o.reszek.forEach(function (r) {
      if (!r[1]) return;
      var megj = r[0] === "Megjegyzés";
      h += '<div class="kartya' + (megj ? " rozsa" : "") + '">' + abschnitt(r[0], megj) +
        (r[0] === "Kata" ? '<p class="kata-cim">' + esc(r[1]) + "</p>" : "<p>" + sor(r[1]) + "</p>") + "</div>";
    });
    h += "</div>";
    if (o.stufe > 0) {
      h += '<div class="kartya halvany">' + abschnitt("Japán erőnlét") + "<p>Minden övvizsga része, a vizsga szintjétől függő mennyiségben:</p><ul>" +
        A.japanEronlet.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>";
    }
    return h + '<p class="megjegyzes">A Magyar Karate Szövetség Kyokushin övvizsga-követelményei (felnőtt) alapján. A gyermek vizsgaanyag eltérhet – a vizsga előtt egyeztess az edződdel.</p>';
  }

  function ismetles(db, belso) {
    if (!db) return "";
    return '<details class="ismetles"><summary>Ismétlés a korábbi övekből (' + db + ")</summary>" + belso() + "</details>";
  }

  function technikaLista(l, ovvel) {
    var h = "";
    KAT.forEach(function (k) {
      var r = l.filter(function (t) { return t.kategoria === k; });
      if (!r.length) return;
      h += abschnitt(k) + '<div class="racs">' + r.map(function (t) {
        return bejegyzes(t.nev, t.jelentes, t.id, "technika-" + t.id, ovvel ? t.kategoria + " · " + ovByStufe(t.stufe).fokozat : "");
      }).join("") + "</div>";
    });
    return h;
  }

  function technikaTab(o) {
    var uj = A.technikak.filter(function (t) { return t.stufe === o.stufe; });
    var h = uj.length ? technikaLista(uj, false) : leer(o.stufe === 0
      ? "Fehér övben az alapokat tanulod – az első vizsgaanyag a 10. kyu (narancssárga öv)."
      : "Ehhez az övhöz nem tartozik új alaptechnika. Ismételd a korábbi övek technikáit.");
    var regi = A.technikak.filter(function (t) { return t.stufe >= 1 && t.stufe < o.stufe; });
    return h + ismetles(regi.length, function () { return technikaLista(regi, true); });
  }

  function szoLista(l) {
    var cs = {}, sorrend = [];
    l.forEach(function (w) { if (!cs[w.kategoria]) { cs[w.kategoria] = []; sorrend.push(w.kategoria); } cs[w.kategoria].push(w); });
    return sorrend.map(function (k) {
      return abschnitt(k) + '<div class="racs">' + cs[k].map(function (w) { return bejegyzes(w.japan, w.jelentes, w.id, null); }).join("") + "</div>";
    }).join("");
  }

  function szoTab(o) {
    var uj = A.szavak.filter(function (w) { return w.stufe === o.stufe; });
    var regi = A.szavak.filter(function (w) { return w.stufe < o.stufe; });
    return (uj.length ? szoLista(uj) : leer("Ehhez az övhöz nem tartozik új kifejezés.")) +
      ismetles(regi.length, function () { return szoLista(regi); });
  }

  function kataKartya(k) {
    return '<div class="kartya kata"><div class="kata-fej"><div><h2>' + esc(k.nev) + '</h2><div class="kanji">' + esc(k.kanji) +
      '</div><div class="kiejt">[' + esc(kiejtes(k.nev)) + "]</div></div>" + hangGomb(k.id, k.nev, "nagy") + "</div>" +
      '<p class="kiemelt">' + esc(k.jelentes) + "</p>" + media(k.id) + "<p>" + esc(k.leiras) + '</p><p class="megjegyzes">A pontos mozdulatsort az edződdel gyakorold.</p></div>';
  }

  function kataTab(o) {
    var uj = A.katak.filter(function (k) { return k.stufe === o.stufe; });
    var regi = A.katak.filter(function (k) { return k.stufe < o.stufe; });
    var h = uj.length ? '<div class="racs szeles">' + uj.map(kataKartya).join("") + "</div>"
      : leer("Ehhez az övhöz nem tartozik új kata. Az első katák (Taikyoku Sono Ichi és Ni) a 9. kyu vizsgán szerepelnek.");
    return h + ismetles(regi.length, function () {
      return '<div class="racs">' + regi.map(function (k) {
        return bejegyzes(k.nev, k.jelentes, k.id, "ov-" + k.stufe + "-kata", "Vizsga: " + ovByStufe(k.stufe).fokozat);
      }).join("") + "</div>";
    });
  }

  function elmeletTab(o) {
    var uj = A.temak.filter(function (t) { return t.stufe === o.stufe; });
    var regi = A.temak.filter(function (t) { return t.stufe < o.stufe; });
    var h = uj.length ? uj.map(function (t) {
      return '<div class="kartya"><div class="kartya-fej"><h3>' + esc(t.cim) + "</h3>" + felolvasGomb(t.cim + ". " + t.szoveg) + "</div><p>" + esc(t.szoveg) + "</p></div>";
    }).join("") : leer("Ehhez az övhöz nem tartozik új elméleti téma.");
    return h + ismetles(regi.length, function () {
      return regi.map(function (t) { return '<div class="kartya"><h3>' + esc(t.cim) + "</h3><p>" + esc(t.szoveg) + "</p></div>"; }).join("");
    });
  }

  // ------------------------------------------------------------------
  // 4) Technika részletei
  // ------------------------------------------------------------------

  function technikaOldal(id) {
    var t = A.technikak.filter(function (x) { return x.id === id; })[0];
    if (!t) return fooldal();
    var o = ovByStufe(t.stufe);
    var h = kopf(t.kategoria, o.fokozat + " · " + o.nev, ovMinta(o)) + '<div class="doboz keskeny">' +
      '<div class="tech-fej"><div><h2 class="tech-nev">' + esc(t.nev) + '</h2><div class="kiejt nagy">Kiejtés: [' + esc(kiejtes(t.nev)) + "]</div></div>" +
      hangGomb(t.id, t.nev, "nagy") + '</div><p class="kiemelt nagy">' + esc(t.jelentes) + "</p>" + media(t.id) +
      '<div class="kartya"><div class="kartya-fej">' + abschnitt("Végrehajtás") + felolvasGomb(t.leiras) + "</div><p>" + esc(t.leiras) + "</p></div>";
    if (t.hiba) h += '<div class="kartya rozsa"><div class="kartya-fej">' + abschnitt("Gyakori hiba", true) + felolvasGomb("Gyakori hiba: " + t.hiba) + "</div><p>" + esc(t.hiba) + "</p></div>";
    h += '<p class="megjegyzes">Csak edző felügyelete mellett gyakorold.</p><a class="link" href="#ov-' + t.stufe + '-technika">' + esc(o.fokozat) + " technikái ›</a></div>";
    return h;
  }

  // ------------------------------------------------------------------
  // 5) Az utam – ellenőrzőlista
  // ------------------------------------------------------------------

  function checklista(o) {
    var l = [];
    o.reszek.forEach(function (r) {
      if (r[0] === "Megjegyzés" || r[0] === "Első lépések" || !r[1]) return;
      l.push([r[0], r[1].replace(/\n/g, " · ")]);
    });
    var nb = A.szavak.filter(function (w) { return w.stufe === o.stufe; }).length;
    if (nb) l.push(["Új kifejezések", nb + " japán kifejezés ehhez az övhöz"]);
    return l;
  }
  function pipalva(o, i) { return !!tar.get("pipa_" + o.stufe + "_" + i, false); }
  function szazalek(o) {
    var l = checklista(o);
    if (!l.length) return 0;
    var n = 0;
    for (var i = 0; i < l.length; i++) if (pipalva(o, i)) n++;
    return Math.floor(n * 100 / l.length);
  }

  function utamOldal() {
    var o = celOv();
    if (!o) return ovekOldal();
    var p = szazalek(o);
    var h = '<section class="kopf"><div class="kopf-sor"><div class="kopf-cim"><h1>Az utam</h1><p>' + esc(o.fokozat + " · " + o.nev) +
      " – a vizsga időpontját az edződ mondja meg</p></div>" + ovMinta(o, "nagy") + '</div><div class="halado"><span>Kész</span><b>' + p +
      ' %</b></div><div class="savsav"><span style="width:' + p + '%"></span></div></section><div class="doboz">' + abschnitt("Vizsga-ellenőrzőlista") + '<div class="racs">';
    checklista(o).forEach(function (pt, i) {
      var be = pipalva(o, i);
      h += '<button class="pipa' + (be ? " be" : "") + '" data-act="pipa" data-i="' + i + '"><span class="doboz-pipa">' + (be ? "✓" : "") +
        "</span><span><strong>" + esc(pt[0]) + "</strong><small>" + esc(pt[1]) + "</small></span></button>";
    });
    h += '</div><p class="megjegyzes">A pipát akkor tedd ki, ha az edzésen már biztosan megy.</p>' +
      '<a class="link" href="#ov-' + o.stufe + '">' + esc(o.fokozat) + " vizsgaanyaga ›</a>";
    if (o.stufe > 0) h += '<a class="fogomb" href="#kviz-' + o.stufe + '">Kvíz az övemhez</a>';
    return h + "</div>";
  }

  // ------------------------------------------------------------------
  // 6) Egyesület
  // ------------------------------------------------------------------

  var NAP = { "hétfő": "H", "kedd": "K", "szerda": "SZE", "csütörtök": "CS", "péntek": "P", "szombat": "SZO", "vasárnap": "V" };

  function egyesuletOldal() {
    var h = kopf(E.szervezet || "Egyesület", E.leiras) + '<div class="doboz">';
    if (!(E.klubok || []).length) h += leer("Még nincs klub megadva (js/egyesulet.js).");
    (E.klubok || []).forEach(function (k) {
      h += '<div class="kartya sotet klub-fej"><h2>' + esc(k.nev) + "</h2>" + (k.edzok || []).map(function (e) {
        return "<p>Edző: " + esc(e.nev) + (e.fokozat ? " · " + esc(e.fokozat) : "") + "</p>";
      }).join("") + "</div>";
      if ((k.kiemelesek || []).length) {
        h += '<div class="kartya pirosk"><h2>' + esc(k.kiemelesek[0]) + "</h2><ul>" +
          k.kiemelesek.slice(1).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>";
      }
      h += '<div class="racs">';
      (k.telephelyek || []).forEach(function (t) {
        var hely = [t.helyszin, t.cim].filter(Boolean);
        var keres = [t.helyszin, t.cim, t.varos].filter(Boolean).join(", ");
        h += '<div class="kartya">' + abschnitt("Edzések") + '<h2 class="varos">' + esc(t.varos) + "</h2>" +
          (hely.length ? "<p>" + hely.map(esc).join("<br>") + "</p>" : "") + (t.edzo ? '<p class="szurke">Edző: ' + esc(t.edzo) + "</p>" : "") +
          '<div class="napok">' + (t.edzesek || []).map(function (e) {
            return '<div class="nap"><b>' + esc(NAP[String(e.nap).toLowerCase()] || e.nap) + "</b><small>" + esc(e.nap) + "</small><span>" + esc(e.ido) + "</span></div>";
          }).join("") + "</div>" +
          (keres ? '<a class="link" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(keres) + '" target="_blank" rel="noopener">Megnyitás térképen ›</a>' : "") + "</div>";
      });
      h += "</div>";
      var kap = [];
      if (k.telefon) kap.push(["Telefon", k.telefon, "tel:" + k.telefon.replace(/[^\d+]/g, "")]);
      if (k.email) kap.push(["E-mail", k.email, "mailto:" + k.email]);
      if (k.web) kap.push(["Weboldal", k.web, /^https?:/.test(k.web) ? k.web : "https://" + k.web]);
      if (k.facebook || k.facebook_link) kap.push(["Facebook", k.facebook || "Facebook-oldal", k.facebook_link || "https://www.facebook.com/search/top/?q=" + encodeURIComponent(k.facebook)]);
      if (kap.length) {
        h += '<div class="kartya kapcsolat">' + abschnitt("Kapcsolat") + kap.map(function (x) {
          return '<a href="' + esc(x[2]) + '"' + (/^http/.test(x[2]) ? ' target="_blank" rel="noopener"' : "") + "><span>" + esc(x[0]) + "</span><b>" + esc(x[1]) + "</b></a>";
        }).join("") + "</div>";
      }
    });
    if ((E.linkek || []).length) {
      h += '<div class="kartya">' + abschnitt("Hasznos linkek") + (E.linkek || []).map(function (l) {
        return '<a class="link" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.nev) + " ↗</a>" + (l.leiras ? '<p class="szurke">' + esc(l.leiras) + "</p>" : "");
      }).join("") + "</div>";
    }
    return h + "</div>";
  }

  // ------------------------------------------------------------------
  // 7) Dojo Kun
  // ------------------------------------------------------------------

  function dojoKunOldal() {
    var h = kopf("Dojo Kun", "A kyokushin eskü") + '<div class="doboz keskeny"><div class="kartya halvany"><p>A kyokushin eskü, amelyet az edzés végén közösen mondunk el.</p></div>';
    A.dojoKun.forEach(function (s, i) { h += '<div class="kun"><b>' + (i + 1) + "</b><p>" + esc(s) + "</p></div>"; });
    var teljes = A.dojoKun.map(function (s, i) { return (i + 1) + ". " + s; }).join(" ");
    return h + '<div class="osu sotet-szoveg">Osu!</div><button class="fogomb sotet" data-act="felolvas" data-t="' + esc(teljes) + '">Felolvasás</button></div>';
  }

  // ------------------------------------------------------------------
  // 8) Vezényszó-gyakorló
  // ------------------------------------------------------------------

  var V = null;
  function vezenyPool() { return A.szavak.filter(function (w) { return w.kategoria === "Vezényszavak" || w.kategoria === "Számok"; }); }
  function vezenyUj() {
    var pool = vezenyPool();
    if (!V) V = { pakli: [], akt: null, sorozat: 0, ido: "–" };
    if (!V.pakli.length) V.pakli = kever(pool);
    var w = V.pakli.shift();
    if (V.akt && w.id === V.akt.id && V.pakli.length) w = V.pakli.shift();
    V.akt = w;
    var tobbi = kever(pool.filter(function (x) { return x.kategoria === w.kategoria && x.jelentes !== w.jelentes; })).slice(0, 3);
    V.opciok = kever(tobbi.concat([w]));
    V.hiba = false; V.kesz = false; V.mutat = false; V.start = Date.now(); V.valaszok = {};
  }
  function vezenyOldal() {
    if (!V || !V.akt) vezenyUj();
    var w = V.akt, lat = V.kesz || V.hiba || V.mutat;
    var h = '<div class="sotet-oldal">' + kopf("Vezényszavak", "Az oldal vezényel – mint az edző a dojóban. Koppints minél gyorsabban a helyes jelentésre.") +
      '<div class="doboz keskeny kozep"><button class="nagy-hang" data-act="kmd-hang" aria-label="Vezényszó újra">' + SZORO + "</button>" +
      '<div class="kmd-szo' + (lat ? "" : " rejtett") + '">' + esc(w.japan) + '</div><div class="kmd-kiejt' + (lat ? "" : " rejtett") + '">[' + esc(kiejtes(w.japan)) + "]</div>" +
      '<div class="kmd-allas">Reakció: ' + esc(V.ido) + " · Sorozat: " + V.sorozat + "</div>" +
      (lat ? "" : '<button class="link-gomb" data-act="kmd-mutat">Szó mutatása</button>') + '<div class="valaszok">';
    V.opciok.forEach(function (o, i) {
      var cls = V.valaszok[i] || "";
      h += '<button class="valasz ' + cls + '" data-act="kmd-valasz" data-i="' + i + '">' + esc(o.jelentes) + "</button>";
    });
    return h + "</div></div></div>";
  }

  // ------------------------------------------------------------------
  // 9) Szókártyák
  // ------------------------------------------------------------------

  var K = null;
  function kartyakUj() {
    var cel = celOv(), bis = cel ? cel.stufe : 13, l = [];
    A.technikak.forEach(function (t) { if (t.stufe <= bis) l.push({ id: t.id, jp: t.nev, hu: t.jelentes, mag: t.leiras }); });
    A.szavak.forEach(function (w) { if (w.stufe <= bis) l.push({ id: w.id, jp: w.japan, hu: w.jelentes, mag: w.kategoria }); });
    K = { pakli: kever(l), ossz: l.length, kesz: [], hatul: false };
  }
  function kartyakOldal() {
    if (!K) kartyakUj();
    var cel = celOv();
    var h = kopf("Szókártyák", cel ? "Minden a(z) " + cel.fokozat + " vizsgáig" : "Az összes öv", '<span class="szamlalo">' + K.kesz.length + " / " + K.ossz + "</span>") +
      '<div class="savsav vekony"><span style="width:' + (K.ossz ? K.kesz.length * 100 / K.ossz : 0) + '%"></span></div><div class="doboz keskeny">';
    var c = K.pakli[0];
    var vissza = K.kesz.length ? '<button class="link-gomb" data-act="k-vissza">↶ Utolsó kártya vissza (' + esc(K.kesz[K.kesz.length - 1].jp) + ")</button>" : "";
    if (!c) {
      return h + '<div class="kartya kozep"><h2>Mind megvan!</h2><p>' + K.ossz + ' kártya kész. Osu!</p></div><button class="fogomb" data-act="k-ujra">Újra elölről</button>' + vissza + "</div>";
    }
    if (!K.hatul) {
      h += '<div class="szokartya" data-act="k-fordit" role="button" tabindex="0">' + abschnitt("Mit jelent?") + '<div class="sk-jp">' + esc(c.jp) +
        '</div><div class="kiejt nagy">[' + esc(kiejtes(c.jp)) + "]</div>" + hangGomb(c.id, c.jp, "nagy") + '<small>Koppints a megfordításhoz</small></div>';
    } else {
      h += '<div class="szokartya hatul" data-act="k-fordit" role="button" tabindex="0">' + abschnitt("Válasz") + '<div class="sk-hu">' + esc(c.hu) +
        "</div>" + (c.mag ? "<p>" + esc(c.mag) + "</p>" : "") + "<strong>" + esc(c.jp) + "</strong></div>";
    }
    return h + '<div class="ket-gomb"><button class="keret-gomb" data-act="k-nem">Nem tudtam<small>még visszajön</small></button>' +
      '<button class="zold-gomb" data-act="k-tudtam">Tudtam ✓<small>kártya kész</small></button></div>' + vissza + "</div>";
  }

  // ------------------------------------------------------------------
  // 10) Kvíz
  // ------------------------------------------------------------------

  var Q = null;
  function haromMasik(lista, helyes, kulcs, hasonlo) {
    var r = kulcs(helyes);
    var mas = egyedi(lista.filter(function (x) { return kulcs(x) !== r; }), kulcs);
    return kever(mas.filter(hasonlo)).concat(kever(mas.filter(function (x) { return !hasonlo(x); }))).slice(0, 3);
  }
  function v(text, kiej) { return { t: text, k: kiej || null }; }
  function jv(s) { return v(s, kiejtes(s)); }
  function kerdes(kat, feladat, szo, kiej, helyes, rosszak, id, romaji) {
    return { kat: kat, feladat: feladat, szo: szo, kiej: kiej, helyes: helyes, opciok: kever(rosszak.concat([helyes])), id: id, romaji: romaji };
  }
  function kvizSablonok(o) {
    var s = [];
    A.technikak.filter(function (t) { return t.stufe >= 1 && t.stufe <= o.stufe; }).forEach(function (t) {
      s.push(function () {
        return kerdes("Technika · " + t.kategoria, "Hogy hívják japánul?", t.jelentes, null, jv(t.nev),
          haromMasik(A.technikak, t, function (x) { return x.nev; }, function (x) { return x.kategoria === t.kategoria; }).map(function (x) { return jv(x.nev); }), t.id, t.nev);
      });
      s.push(function () {
        return kerdes("Technika · " + t.kategoria, "Mit jelent?", t.nev, kiejtes(t.nev), v(t.jelentes),
          haromMasik(A.technikak, t, function (x) { return x.jelentes; }, function (x) { return x.kategoria === t.kategoria; }).map(function (x) { return v(x.jelentes); }), t.id, t.nev);
      });
    });
    A.szavak.filter(function (w) { return w.stufe >= 1 && w.stufe <= o.stufe; }).forEach(function (w) {
      s.push(function () {
        return kerdes("Kifejezés · " + w.kategoria, "Mit jelent?", w.japan, kiejtes(w.japan), v(w.jelentes),
          haromMasik(A.szavak, w, function (x) { return x.jelentes; }, function (x) { return x.kategoria === w.kategoria; }).map(function (x) { return v(x.jelentes); }), w.id, w.japan);
      });
      s.push(function () {
        return kerdes("Kifejezés · " + w.kategoria, "Hogy mondják japánul?", w.jelentes, null, jv(w.japan),
          haromMasik(A.szavak, w, function (x) { return x.japan; }, function (x) { return x.kategoria === w.kategoria; }).map(function (x) { return jv(x.japan); }), w.id, w.japan);
      });
    });
    A.katak.filter(function (k) { return k.stufe >= 1 && k.stufe <= o.stufe; }).forEach(function (k) {
      s.push(function () {
        return kerdes("Kata", "Mit jelent a kata neve?", k.nev, kiejtes(k.nev), v(k.jelentes),
          haromMasik(A.katak, k, function (x) { return x.jelentes; }, function () { return true; }).map(function (x) { return v(x.jelentes); }), k.id, k.nev);
      });
      s.push(function () {
        var ov = ovByStufe(k.stufe);
        return kerdes("Kata", "Melyik kata tartozik ehhez a vizsgához?", ov.fokozat + " · " + ov.nev, null, jv(k.nev),
          haromMasik(A.katak.filter(function (x) { return x.stufe !== k.stufe; }), k, function (x) { return x.nev; }, function () { return true; }).map(function (x) { return jv(x.nev); }), k.id, k.nev);
      });
    });
    A.kerdesek.filter(function (q) { return q.stufe <= o.stufe; }).forEach(function (q) {
      s.push(function () { return kerdes("Tudás", "Elméleti kérdés", q.kerdes, null, v(q.helyes), q.rossz.map(function (x) { return v(x); }), q.id, ""); });
    });
    return s;
  }
  function kvizKovetkezo() {
    if (!Q.pakli.length) Q.pakli = kever(Q.sablonok);
    var f = Q.pakli.shift()();
    if (Q.akt && f.szo === Q.akt.szo) { if (!Q.pakli.length) Q.pakli = kever(Q.sablonok); f = Q.pakli.shift()(); }
    Q.akt = f; Q.zarva = false; Q.hiba = false; Q.valaszok = {};
  }
  function kvizOldal(n) {
    var o = ovByStufe(n);
    if (!Q || Q.stufe !== n) { Q = { stufe: n, sablonok: kvizSablonok(o), pakli: [], akt: null, sorozat: 0 }; kvizKovetkezo(); }
    var f = Q.akt;
    var h = kopf("Kvíz · " + o.fokozat, "Helyes válasz egymás után: " + Q.sorozat, ovMinta(o)) + '<div class="doboz keskeny">' +
      '<div class="kartya kerdes"><span class="kat-cimke">' + esc(f.kat) + '</span><p class="feladat">' + esc(f.feladat) + "</p>" +
      '<h2 class="' + (f.szo.length > 30 ? "hosszu" : "") + '">' + esc(f.szo) + "</h2>" +
      (f.kiej ? '<div class="kiejt nagy">[' + esc(f.kiej) + "]</div>" + hangGomb(f.id, f.romaji) : "") + '</div><div class="valaszok vilagos">';
    f.opciok.forEach(function (a, i) {
      h += '<button class="valasz ' + (Q.valaszok[i] || "") + '" data-act="kviz-valasz" data-i="' + i + '">' + esc(a.t) + (a.k ? "<small>[" + esc(a.k) + "]</small>" : "") + "</button>";
    });
    return h + '</div><a class="keret-gomb piros" href="#' + (o ? "ov-" + n : "") + '">Befejezés</a></div>';
  }
  function kvizValasztoOldal() {
    var cel = celOv();
    if (cel && cel.stufe > 0) return kvizOldal(cel.stufe);
    uzenet("Először válaszd ki az övedet.");
    return ovekOldal();
  }

  // ------------------------------------------------------------------
  // Útvonalak
  // ------------------------------------------------------------------

  var MENU = [
    ["", "Főoldal"], ["ovek", "Övek – vizsgaanyag"], ["utam", "Az utam"], ["kartyak", "Szókártyák"],
    ["vezenyszavak", "Vezényszavak"], ["kviz", "Kvíz"], ["dojokun", "Dojo Kun"], ["egyesulet", "Egyesület"]
  ];

  function menuRajzol() {
    var nav = document.getElementById("menu-lista");
    nav.innerHTML = MENU.map(function (m) { return '<a href="#' + m[0] + '" data-menu="' + m[0] + '">' + m[1] + "</a>"; }).join("") +
      (E.linkek || []).map(function (l) { return '<a class="kulso" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.nev) + " ↗</a>"; }).join("");
  }
  function menu(nyit) {
    document.body.classList.toggle("menu-nyitva", nyit);
    document.getElementById("menu-gomb").setAttribute("aria-expanded", nyit ? "true" : "false");
  }

  var elozoUt = null;
  function render() {
    var h = (location.hash || "").replace(/^#/, "");
    var m, html, vissza = "";
    if (!h) html = fooldal();
    else if (h === "ovek") { html = ovekOldal(); vissza = ""; }
    else if ((m = /^ov-(\d+)(?:-(technika|kata|szavak|elmelet))?$/.exec(h)) && +m[1] < A.ovek.length) { html = ovOldal(+m[1], m[2] || ""); vissza = "ovek"; }
    else if ((m = /^technika-(\w+)$/.exec(h))) {
      var t = A.technikak.filter(function (x) { return x.id === m[1]; })[0];
      html = technikaOldal(m[1]); vissza = t ? "ov-" + t.stufe + "-technika" : "";
    }
    else if (h === "utam") html = utamOldal();
    else if (h === "kartyak") html = kartyakOldal();
    else if (h === "vezenyszavak") html = vezenyOldal();
    else if (h === "kviz") html = kvizValasztoOldal();
    else if ((m = /^kviz-(\d+)$/.exec(h)) && +m[1] > 0 && +m[1] < A.ovek.length) { html = kvizOldal(+m[1]); vissza = "ov-" + m[1]; }
    else if (h === "egyesulet") html = egyesuletOldal();
    else if (h === "dojokun") html = dojoKunOldal();
    else html = fooldal();

    var ugyanaz = elozoUt === h, y = window.scrollY;
    tartalom.innerHTML = html;
    window.scrollTo(0, ugyanaz ? y : 0);
    elozoUt = h;

    var vg = document.getElementById("vissza-gomb");
    vg.hidden = !h;
    vg.setAttribute("href", "#" + vissza);
    Array.prototype.forEach.call(document.querySelectorAll("#menu-lista a[data-menu]"), function (a) {
      a.classList.toggle("aktiv", a.getAttribute("data-menu") === h.split("-")[0] || (a.getAttribute("data-menu") === "ovek" && /^(ov|technika)-/.test(h)));
    });
    menu(false);
    if (beszed && h !== "vezenyszavak") beszed.cancel();
    if (h === "vezenyszavak" && V && !V.kesz && !V.hiba) setTimeout(function () { if (location.hash === "#vezenyszavak" && V && V.akt) { V.start = Date.now(); mond(V.akt.id, V.akt.japan); } }, 500);
  }

  // ------------------------------------------------------------------
  // Események
  // ------------------------------------------------------------------

  var kesleltetes = null;
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");
    if (act !== "k-fordit" || !e.target.closest(".hanggomb")) e.preventDefault();
    switch (act) {
      case "mond": e.stopPropagation(); mond(el.getAttribute("data-id"), el.getAttribute("data-r")); return;
      case "felolvas": felolvas(el.getAttribute("data-t")); return;
      case "cel": {
        var n = +el.getAttribute("data-n"), c = celOv();
        tar.set("cel", c && c.stufe === n ? -1 : n); K = null; render(); return;
      }
      case "pipa": {
        var o = celOv(), i = el.getAttribute("data-i");
        tar.set("pipa_" + o.stufe + "_" + i, !pipalva(o, +i)); render(); return;
      }
      case "k-fordit": if (e.target.closest(".hanggomb")) return; K.hatul = !K.hatul; render(); return;
      case "k-nem": { var x = K.pakli.shift(); K.pakli.splice(Math.min(4, K.pakli.length), 0, x); K.hatul = false; render(); return; }
      case "k-tudtam": K.kesz.push(K.pakli.shift()); K.hatul = false; render(); return;
      case "k-vissza": if (K.kesz.length) { K.pakli.unshift(K.kesz.pop()); K.hatul = false; render(); } return;
      case "k-ujra": kartyakUj(); render(); return;
      case "kmd-hang": V.start = Date.now(); mond(V.akt.id, V.akt.japan); return;
      case "kmd-mutat": V.mutat = true; render(); return;
      case "kmd-valasz": {
        if (V.kesz) return;
        var j = +el.getAttribute("data-i");
        if (V.opciok[j] === V.akt) {
          V.kesz = true; V.valaszok[j] = "jo";
          V.ido = ((Date.now() - V.start) / 1000).toFixed(1).replace(".", ",") + " mp";
          if (!V.hiba) V.sorozat++;
          render();
          clearTimeout(kesleltetes);
          kesleltetes = setTimeout(function () {
            if (location.hash !== "#vezenyszavak") return;
            vezenyUj(); render();
          }, 1400);
        } else { V.hiba = true; V.sorozat = 0; V.valaszok[j] = "rossz"; render(); }
        return;
      }
      case "kviz-valasz": {
        if (Q.zarva) return;
        var k = +el.getAttribute("data-i"), f = Q.akt;
        if (f.opciok[k] === f.helyes) {
          Q.zarva = true; Q.valaszok[k] = "jo";
          if (!Q.hiba) Q.sorozat++;
          if (f.romaji) mond(f.id, f.romaji);
          render();
          var hol = location.hash;
          clearTimeout(kesleltetes);
          kesleltetes = setTimeout(function () { if (location.hash !== hol) return; kvizKovetkezo(); render(); }, 1300);
        } else { Q.hiba = true; Q.sorozat = 0; Q.valaszok[k] = "rossz"; render(); }
        return;
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".szokartya")) { e.preventDefault(); e.target.click(); }
    if (e.key === "Escape") menu(false);
  });
  document.getElementById("menu-gomb").addEventListener("click", function () { menu(!document.body.classList.contains("menu-nyitva")); });
  document.getElementById("menu-hatter").addEventListener("click", function () { menu(false); });
  document.getElementById("menu-lista").addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (a && a.getAttribute("href") === location.hash) { menu(false); render(); }
    else if (a) menu(false);
  });
  window.addEventListener("hashchange", function () { if (location.hash === "#vezenyszavak") V = null; render(); });

  menuRajzol();
  if (location.hash === "#vezenyszavak") V = null;
  render();
})();
