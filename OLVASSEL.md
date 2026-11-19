# Kyokushin Karate – övvizsga-felkészítő weboldal

Statikus weboldal (HTML + CSS + JavaScript), szerver vagy adatbázis nélkül. Telefonra, tabletre és gépre optimalizálva.
Bármilyen tárhelyre feltölthető (pl. GitHub Pages), és később beépíthető a szövetség weboldalába
(pl. saját aloldalként: `/vizsgaanyag/` mappába másolva, vagy iframe-ben).

## Fájlok
- `index.html` – az oldal váza
- `css/style.css` – megjelenés
- `js/adatok.js` – vizsgaanyag: övek, technikák, katák, kifejezések, elmélet, kvízkérdések
- `js/egyesulet.js` – **klubok, telephelyek, edzők, edzésidők, menülinkek (pl. Kyotech)** – ezt szerkeszd
- `js/media.js` – képek, videók, saját hangfelvételek listája
- `js/app.js` – működés

## Új klub / telephely / link
`js/egyesulet.js`: másold le a minta egy elemét és írd át. Új menülink: a `linkek` listába.

## Kiejtés
A hangszóró gomb a böngésző felolvasóját használja. Japán hang esetén japánul mond, különben
a magyar átírást olvassa fel. Saját felvétel a `js/media.js`-ben adható meg (`hang:`).

## Helyben kipróbálás
Elég megnyitni az `index.html`-t a böngészőben.
