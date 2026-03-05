# Meal & Grocery Planner

Eine Web-App zur Verwaltung von Einkaufslisten, Rezepten und Wochenplanung – optimiert für mobile Nutzung.

## Features

- **Einkaufsliste** – Bring!-ähnliche Grid-Ansicht mit Emoji-Icons, gruppiert nach Kategorien. Artikel antippen zum Abhaken.
- **Rezepte** – Rezepte mit Zutaten, Schritten und Bildern erstellen und verwalten. Koch-Modus mit Wake Lock, damit der Bildschirm an bleibt. Zutaten direkt auf die Einkaufsliste übertragen.
- **Wochenplaner** – Mahlzeiten (Mittag & Abend) pro Wochentag planen. Wochenweise navigieren.
- **Zutaten** – Alle Zutaten verwalten und individuelle Emoji-Icons zuweisen.
- **Dark Mode** – Helles und dunkles Design, umschaltbar über die Navigation.
- **Passwortschutz** – Einfacher Gatekeeper, damit nur berechtigte Nutzer Zugriff haben.

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router) mit React 19 und TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (PostgreSQL-Datenbank + Storage für Rezeptbilder)
- Deployment auf [Vercel](https://vercel.com/)

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen anlegen
cp .env.example .env.local
# Werte in .env.local eintragen (siehe unten)

# Dev-Server starten
npm run dev
```

Die App ist dann unter [http://localhost:3000](http://localhost:3000) erreichbar.

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL des Supabase-Projekts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Öffentlicher Supabase-Schlüssel |
| `APP_PASSWORD` | Passwort für den Zugangsschutz (nur serverseitig) |

## Projektstruktur

```
app/
├── page.tsx              # Einkaufsliste
├── rezepte/              # Rezepte (Liste, Detail, Editor)
├── planer/               # Wochenplaner
├── zutaten/              # Zutatenverwaltung
└── api/auth/             # Authentifizierung
components/
├── Navigation.tsx        # Bottom-Tab-Navigation
├── Gatekeeper.tsx        # Passwortschutz
└── recipes/              # Rezept-Komponenten
lib/
├── supabase.ts           # Supabase-Client
├── itemIcons.ts          # Emoji-Icon-Mapping
└── types.ts              # TypeScript-Typen
```

## Datenbank

Die App nutzt folgende Supabase-Tabellen:

- **items** – Zutaten mit Name, Kategorie und optionalem Custom-Icon
- **shopping_list** – Aktive Einkaufsliste (Referenz auf Items)
- **recipes** – Rezepte mit Titel und Bild
- **recipe_steps** – Zubereitungsschritte
- **recipe_ingredients** – Zutaten pro Rezept/Schritt
- **meal_plan** – Wochenplan (Datum, Mahlzeit, Rezept)
