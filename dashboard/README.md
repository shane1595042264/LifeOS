# LifeOS Documentation Dashboard (Firebase)

Web-first dashboard scaffold for managing LifeOS documentation spaces using Firebase (Firestore/Auth/Storage). Ships as a React + Vite app and can be wrapped via PWA/Tauri for multiplatform delivery.

## Setup
1) Copy `.env.example` → `.env.local` and keep it out of git.
2) Enable Firebase Auth (email/password for now, or OIDC) in the Firebase console.
3) `npm install`
4) `npm run dev`

## Firebase Rules (initial guidance)
- Firestore: roles/capabilities on `spaces`, `pages`, etc. (to be added); during prototyping you may allow authenticated read/write.
- Storage: restrict uploads to authenticated users and scope to related space/page.
- Do **not** bundle the service account key in the client; use it only in Cloud Functions or server scripts.

## What’s Implemented
- Firebase client initialization (Auth/Firestore/Storage) via Vite env vars.
- Auth screen (email/password) and sign-up flow.
- Spaces list with real-time Firestore listener and create-space form.
- UI scaffolding for next steps: rules, pages/blocks editor.

## Next Steps
- Add TipTap + Yjs Firestore provider for collaborative page editing.
- Implement Cloud Functions for publish/rule evaluation and search indexing.
- Define Firestore security rules and role claims; add Storage rules.
