# Client Dashboard Plan (Firebase-backed)

Goal: deliver a multiplatform dashboard that reads/writes docs in Firebase (Firestore/Storage/Auth), supports real-time collaboration, and surfaces pages/spaces/versions with rule hints.

---

## Stack Recommendation
- **Primary UI:** Web (React + Vite or Next.js) with TipTap/ProseMirror + **Yjs Firestore provider** for CRDT edits. This gives rich text, embeds, presence, and mature Yjs ecosystem.
- **Packaging for multiplatform:** PWA for mobile/desktop browsers; wrap with **Tauri** or **Electron** for desktop app distribution. (Optional) mobile shells via Capacitor/PWA install. This avoids Flutter’s current lack of first-class Yjs support.
- **Firebase Client SDK:** Firestore (real-time listeners), Auth (email link/OIDC), Storage (attachments). Admin SDK stays server-side only (no private key in client).
- **Rule hooks:** Implement rule evaluation as Cloud Functions callable endpoints on publish; client surfaces rule status/approvals.

Why not Flutter first? Flutter works well with Firebase, but real-time CRDT editing (Yjs/TipTap) is JS-centric. Bridging that in Flutter is heavy. We can add a Flutter companion (read/annotate) later if phone-native is required.

---

## Data/Collections (Firebase)
- `spaces/{spaceId}`: name, slug, owner, members/roles.
- `pages/{pageId}`: spaceId, title, path, status (draft/published), author, timestamps.
- `pages/{pageId}/versions/{versionId}`: summary, diff metadata, createdBy, createdAt.
- `pages/{pageId}/presence/{userId}`: cursor/selection/presence data (Yjs awareness).
- `pages/{pageId}/yjs` (single doc): CRDT state stored via Yjs Firestore provider (or updates collection).
- `rules/{ruleId}`: scope, scriptRef/params, approval state.
- `attachments/{attachmentId}`: storage refs, metadata.
- `events/{eventId}`: audit trail (optional BigQuery export).

---

## Security Rules (high level)
- Firestore rules enforce role-based capabilities: read/edit/publish/admin/rules.
- No admin SDK/private key in client. Use Firebase Auth custom claims for roles.
- Storage rules mirror Firestore access (attachment scoped to page/space).

---

## What I Need From You to start coding
- Firebase **client config** (non-secret): `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId` (and `measurementId` if GA).
- Decide **auth mode**: email link, password, or OIDC (Google/Microsoft/etc).
- Confirm we target **web-first** with PWA + Tauri desktop wrapping. (If you prefer Flutter despite Yjs gap, say so and we’ll scope a simpler editor or embed a webview.)
- Firestore **region** and naming conventions, if any.

---

## First Implementation Slice (web)
1) Bootstrap React + Vite, add Firebase SDK (auth/firestore/storage), TipTap, Yjs + Firestore provider, and Tailwind/Chakra for layout.
2) Auth flow (email link/OIDC), session persistence, role claim read.
3) Spaces list → Pages list → Page editor screen:
   - Yjs collaborative editor (TipTap) with presence cursors.
   - Save/publish button triggering Cloud Function for rules; show approval required banner.
   - Version side panel (list versions).
4) Storage upload for attachments with scoped rules.
5) Basic search (Firestore queries; optional Algolia via Function).

---

## Firebase Admin Key Handling
- Keep the service account key **server-side only** (not in the client). Use it in Cloud Functions or any server you run for migrations/imports.
- Store it outside the repo or in a secure secret manager; do not bundle with the client build.

---

## If you want Flutter instead
- Use FlutterFire (auth/firestore/storage). For rich collaborative editing, either (a) embed a webview with the React/Yjs editor, or (b) implement a simpler markdown/block editor and accept reduced collaboration fidelity for now.
