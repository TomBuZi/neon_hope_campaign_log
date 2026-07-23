# Neon Hope – Kampagnen-Logbuch / Campaign Log

Ein digitales Kampagnen-Logbuch für **Neon Hope – Eine bessere Menschheit / A Better Humanity**.
Läuft komplett im Browser, ganz ohne Server, und ist auf **GitHub Pages** gehostet.

**Live:** https://tombuzi.github.io/neon_hope_campaign_log/

*(A digital campaign log for Neon Hope. Runs entirely in the browser, no server, hosted on GitHub Pages.)*

## Features

- **Zweisprachig DE/EN** – Umschalter oben rechts.
- **Erfasst** die Felder des offiziellen Print-Logs: Charaktere (Charakter, Charakter-Vorteil,
  Story Verbündete), die Zähler *Start-Ressourcen*, *Begleiter* und *Nubicon beobachtet dich*
  (je 0–15), *Kampagnen-Notizen* und *Veränderungen der Modifikatoren-Auswahl*.
- **Charaktere hinzufügen/entfernen** – ein neues Log startet mit einem Charakter; über den
  Button neben der Überschrift „Charaktere" kommen weitere hinzu (max. 4). Ein Charakter lässt
  sich nur entfernen, wenn ihm keine Verbündeten zugeordnet sind, und der letzte Charakter
  bleibt immer bestehen. Entfernen (Charaktere, Verbündete, Notizen, Änderungen) fragt vorher
  nach.
- **Charakter per Dropdown** – Auswahl aus allen 12 spielbaren Charakteren (Grundspiel,
  alternative Versionen und Erweiterung *A Hopeful Cause*). Der zugehörige **Charakter-Vorteil**
  wird als zweites Dropdown angeboten, wobei Vorder- und Rückseite des doppelseitigen Vorteils
  einzeln wählbar sind. Englische Kartendaten stammen von
  [neonhopedb.com](https://neonhopedb.com), die deutschen Namen aus der offiziellen deutschen
  Ausgabe.
- **Listen-Eingaben** für Story Verbündete, Kampagnen-Notizen und Veränderungen der
  Modifikatoren-Auswahl: Einträge werden explizit hinzugefügt und entfernt
  (Notizen/Änderungen mehrzeilig, wachsen automatisch mit). Ein neuer Eintrag lässt sich erst
  anlegen, wenn der vorige gefüllt ist; ein geleerter Eintrag wird beim Verlassen entfernt.
  Reihenfolge per Drag & Drop (am Griff ⠿, funktioniert auch auf Touch-Geräten); Verbündete
  lassen sich zu einem anderen (gesetzten) Charakter ziehen – auch auf einen Charakter, der
  noch keine Verbündeten hat.
- **Automatisches Speichern** im Browser (`localStorage`) – nichts verlässt dein Gerät.
- **Mehrere Logs** parallel verwalten, umbenennen, löschen.
- **Export / Import** als `.json`-Datei zur Sicherung oder Übertragung zwischen Geräten.
- **Link teilen** – der komplette Log-Zustand wird komprimiert in einen Link kodiert.
  Diesen Link kannst du dir selbst (z. B. per E-Mail) schicken, als Lesezeichen speichern
  oder an Mitspielende weitergeben; beim Öffnen wird das Log geladen.

## Speicher-Konzept

Da GitHub Pages rein statisch ist (kein Servercode, keine Datenbank, kein E-Mail-Versand),
gibt es bewusst **kein Backend**. Deine Daten liegen ausschließlich lokal im Browser.
Zum Sichern oder Weitergeben dienen **Export/Import** und der **teilbare Link** – dieser Link
enthält den gesamten Log-Inhalt und ersetzt damit die klassische „per E-Mail zugeschickte
GUID". Jedes Log hat intern eine GUID; das erleichtert eine spätere optionale Backend-Anbindung.

## Lokal ausführen

```bash
# Reicht in der Regel schon: index.html direkt im Browser öffnen.
# Empfohlen (sauberes Laden):
python -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Aufbau

| Datei         | Zweck                                                          |
| ------------- | -------------------------------------------------------------- |
| `index.html`  | Grundgerüst der Seite                                          |
| `styles.css`  | Design, responsiv, hell/dunkel je nach System                  |
| `i18n.js`     | Deutsche und englische Beschriftungen                          |
| `roster.js`   | Charaktere und Charakter-Vorteile                              |
| `app.js`      | Zustand, Speichern/Laden, Zähler, Export/Import, Link teilen   |
| `fonts/`      | Selbst gehostete Schriften (woff2)                             |

Die Print-PDFs (DE/EN) liegen als Referenz ebenfalls im Repository.

## Design & Schriften

Die Optik ist am offiziellen Auftritt [neonhopegame.com](https://neonhopegame.com/de/)
angelehnt (heller Look, Solarpunk-Grün/Teal). Standardmäßig folgt das Design per
`prefers-color-scheme` dem System (hell/dunkel) und lässt sich zusätzlich über den
Umschalter (🌙/☀️) oben rechts manuell festlegen; die Wahl wird im Browser gespeichert.
Verwendete Schriften: **Red Hat Display** (Überschriften)
und **Nunito Sans** (Text) – selbst gehostet unter `fonts/`, lizenziert unter der
[SIL Open Font License 1.1](fonts/OFL.txt). Es werden weder das offizielle Logo noch Artworks
verwendet; die Angleichung erfolgt nur über Farben und Typografie.

## Datenschutz

Alle Eingaben verbleiben in deinem Browser. Es werden keine Daten an einen Server gesendet.
Ein geteilter Link enthält den Log-Inhalt in der URL – teile ihn nur mit Personen, die das
Log sehen dürfen.
