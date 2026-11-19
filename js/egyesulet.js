// =====================================================================
// EGYESÜLET – klubok, telephelyek, edzők, edzésidők, menülinkek
// Új klub: másold le a "klubok" egy elemét. Új telephely: másold le a
// "telephelyek" egy elemét. Ha egy telephelyen más az edző, töltsd ki az
// "edzo" mezőt. Az üres mezők nem jelennek meg az oldalon.
// =====================================================================

window.EGYESULET = {
  szervezet: "Kyokushin Karate",
  leiras: "Egyesületeink, telephelyeink és edzéseink",

  // Külső hivatkozások – megjelennek a menüben és a főoldalon.
  linkek: [
    { nev: "Kyotech webáruház", leiras: "Kyokushin ruházat és felszerelés", url: "http://kyotech.hu/" }
  ],

  klubok: [
    {
      nev: "Szanyi Dojo Kyokushin Karate klub",
      edzok: [
        { nev: "Sensei Szanyi Attila", fokozat: "3. dan" }
      ],
      telefon: "+36 70 667 1456",
      email: "",
      web: "",
      facebook: "Szanyi Dojo Kyokushin Karate klub",
      facebook_link: "",
      kiemelesek: [
        "Ingyenes próbaedzés",
        "Versenyzési lehetőség",
        "Családi kedvezmény",
        "6 éves kortól fiúknak és lányoknak"
      ],
      telephelyek: [
        {
          varos: "Tiszafüred",
          helyszin: "Benedek Gábor Sportcsarnok",
          cim: "",
          edzo: "",
          edzesek: [
            { nap: "Hétfő", ido: "18:00–19:00" },
            { nap: "Szerda", ido: "18:00–19:00" }
          ]
        },
        {
          varos: "Kunhegyes",
          helyszin: "Református Általános Iskola",
          cim: "",
          edzo: "",
          edzesek: [
            { nap: "Kedd", ido: "16:30–18:00" },
            { nap: "Csütörtök", ido: "16:30–18:00" }
          ]
        }
      ]
    }
  ]
};
