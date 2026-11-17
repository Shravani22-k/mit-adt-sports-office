# MIT-ADT Sports Office

React + TypeScript prototype with separate sign-in workspaces for students, sport heads, and administrators.

## Start the app

1. Open PowerShell in this folder: `C:\Users\sonaw\OneDrive\Desktop\job\project\mit-adt-sports`
2. Run `npm run dev`
3. Open the local URL printed by Vite (usually `http://localhost:5173`).

Use the role selector on the sign-in page. For this UI prototype, any non-empty ID/email and password opens the selected workspace. Sign out from the lower-left account area to switch roles. The demo login is not production authentication; real account verification, payments, and persistent records need a backend.

## Project layout

- `src/ui/App.tsx` — role routing, sign-in, student, event-head, and admin dashboards
- `src/ui/styles.css` — shared responsive styles and dashboard-specific layouts
- `src/main.tsx` — React entry point
- `vite.config.js` — Vite React configuration
