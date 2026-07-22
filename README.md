# Neon Hope – Kampagnen-Logbuch / Campaign Log

Ein digitales Kampagnen-Logbuch für **Neon Hope – Eine bessere Menschheit / A Better Humanity**.
Läuft komplett im Browser, ganz ohne Server, und ist auf **GitHub Pages** gehostet.

**Live:** https://tombuzi.github.io/neon_hope_campaign_log/

*(A digital campaign log for Neon Hope. Runs entirely in the browser, no server, hosted on GitHub Pages.)*

## Features

- **Zweisprachig DE/EN** – Umschalter oben rechts.
- **Erfasst** die Felder des offiziellen Print-Logs: 4 Charaktere (Name, Charakter-Vorteil,
  Story Verbündete), die Zähler *Start-Ressourcen*, *Begleiter* und *Nubicon beobachtet dich*
  (je 0–15), *Kampagnen-Notizen* und *Veränderungen der Modifikatoren-Auswahl*.
- **Charakter-Auswahl per Dropdown** – alle 12 spielbaren Charaktere (Grundspiel, alternative
  Versionen und Erweiterung *A Hopeful Cause*). Die Auswahl füllt Name und Charakter-Vorteil
  automatisch (beide bleiben editierbar). Charakter-Vorteile stammen von
  [neonhopedb.com](https://neonhopedb.com); deutsche Tool-Namen sind für die vier
  Grundspiel-Charaktere offiziell, für die übrigen acht eigene Übersetzungen (im UI markiert).
- **Story Verbündete als Namensliste** mit Hinzufügen/Entfernen je Eintrag.
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

| Datei         | Zweck                                                        |
| ------------- | ------------------------------------------------------------ |
| `index.html`  | Grundgerüst der Seite                                        |
| `styles.css`  | Neon-Design, responsiv, hell/dunkel je nach System           |
| `i18n.js`     | Deutsche und englische Beschriftungen                        |
| `app.js`      | Zustand, Speichern/Laden, Zähler, Export/Import, Link teilen |

Die Print-PDFs (DE/EN) liegen als Referenz ebenfalls im Repository.

## Datenschutz

Alle Eingaben verbleiben in deinem Browser. Es werden keine Daten an einen Server gesendet.
Ein geteilter Link enthält den Log-Inhalt in der URL – teile ihn nur mit Personen, die das
Log sehen dürfen.
