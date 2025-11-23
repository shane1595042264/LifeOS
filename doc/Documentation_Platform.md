# Documentation Platform (Server + Client)

Purpose: deliver a Confluence-like documentation layer where users can read/write docs stored in the LifeOS platform with real-time collaboration, rules, and auditability. This is the first user-facing slice of the server + client architecture.

---

## Goals
- Real-time collaborative editing (multi-user cursors, conflict-free).
- Versioning and audit trail (who changed what, when, why).
- Structured + unstructured content (pages, sections, attachments, modules).
- Rules/policies that can attach to spaces/pages to govern editing/approval.
- Searchable (full-text + metadata).
- Extensible via modules (custom fields, macros, embeds).

---

## Proposed Architecture

### Server (Rust by default; Firebase option below)
- **Docs Service (gRPC/HTTP):**
  - CRUD for spaces/pages/blocks.
  - Real-time sync endpoint using WebSocket/HTTP2 streaming with CRDT (Yjs-compatible) document state.
  - Version history endpoints (diffs, revert, comments).
  - Attachment upload/download with object storage backing.
- **Rules/Policy Engine:**
  - Policies bound to scopes (space/page/user/group).
  - Example: approval required before publish, edit windows, restricted sections, automations on change (notify, create task).
  - Scripts in Lua/Rhai for custom rules.
- **Auth & Identity:**
  - JWT/OIDC support; sessions for clients; API keys for automations.
  - Capability-based authorization (read/edit/publish/admin/rules/manage).
- **Search & Index:**
  - Full-text index (e.g., Tantivy) per space with metadata facets.
  - Incremental indexing on publish.
- **Storage:**
  - PostgreSQL: pages, blocks, versions, policies, memberships.
  - Object storage (local/S3-compatible) for attachments/export blobs.
  - Event log for audit (append-only).

#### Firebase Option (good for a fast prototype)
- **Firestore:** store pages/blocks/versions; leverage real-time listeners. Can store Yjs updates per page or use the Yjs Firestore provider.
- **Firebase Auth:** OIDC/passwordless/SAML; map custom claims to capabilities.
- **Cloud Storage:** attachments; signed URLs for clients.
- **Cloud Functions:** rule evaluation hooks (on publish/change), search indexing, and webhooks to other services.
- **Tradeoffs:** quicker to start, no server to host; less control over advanced policy/rule engine, vendor lock-in, billing spikiness on high write volumes. Suitable for initial doc layer; migrate to Rust/Postgres later if needed.

### Client
- **Near-term UI (recommended first):** Web/desktop Rust UI (egui/iced or web with React) using Yjs for collaborative editing and ProseMirror/TipTap-style schema for rich text + embeds.
- **Immersive UI (later):** UE-powered view that consumes the same real-time doc stream; not required to start. No need to download Unreal yet unless you want to prototype the 3D visualization now.
- **Capabilities:**
  - Live editor with shared cursors and presence.
  - Modeled blocks (text, heading, table, code, embed, task list).
  - Inline rule indicators (e.g., “requires approval,” “read-only section”).
  - Comments, mentions, backlinks.
  - Offline cache (SQLite) with sync when reconnected.

### Sync Model
- CRDT-based (Yjs) for low-latency conflict-free edits; server acts as awareness/relay + persistence.
- Publish step to finalize a version (rules can gate publish).
- Background jobs to compute diffs and update search index.

### Module/Rule Hooks
- Modules register as handlers for block types or page-level macros (e.g., embed a metric, include a template).
- Rule engine hooks: on_change, on_publish, on_comment. Scripts can:
  - Validate content (forbid secrets, enforce template completeness).
  - Trigger automations (notify, create task, run tool).
  - Enforce approvals (multi-step, role-based).

---

## APIs (initial cut)
- `Auth`: login/refresh, API key issue/revoke.
- `Spaces`: list/create/update/archive; membership + roles.
- `Pages`: CRUD; fetch by id/path; move; backlinks.
- `Blocks`: streaming edit session (join/leave, updates via Yjs updates); snapshot fetch/save.
- `Versions`: list, diff, revert, comment; publish/unpublish.
- `Rules`: list/attach/detach; evaluate; approve/reject.
- `Search`: query by text, tag, owner, date.
- `Attachments`: upload/download; link to pages/blocks.
- `Events`: audit feed for observability.

---

## Data Model (simplified)
- `space(id, name, slug, owner_id, created_at, archived_at)`
- `page(id, space_id, parent_id, title, path, status[draft|published], author_id, created_at, updated_at)`
- `block(id, page_id, yjs_state_blob, block_type, order_idx, created_at, updated_at)` (server stores CRDT state per page or per block)
- `version(id, page_id, number, author_id, summary, diff_blob, created_at)`
- `rule(id, scope_type[space|page], scope_id, script_ref, params_json, created_at)`
- `membership(user_id, space_id, role)`
- `attachment(id, page_id, path, content_type, size, checksum, created_at)`
- `event(id, actor_id, space_id, page_id, type, payload_json, created_at)`

---

## What I Need From You
- **Database choice:** PostgreSQL DSN for Rust path, or confirm **Firestore** (project id, preferred collection naming, regional settings) for Firebase path.
- **Object storage:** local/S3-compatible for Rust path, or **Firebase Storage** bucket for Firebase path.
- **Auth preference:** OIDC/JWT (Rust) or **Firebase Auth** (email magic link/OIDC/SAML); provide IdP details if applicable.
- **Client starting point:** build a lightweight web/desktop editor first, or begin UE prototype. (Recommendation: start with web/desktop; add UE later.)
- **Confluence content import:** if you want migration, export format (XML/HTML/Markdown) and a sample export for mapping.

---

## Immediate Build Plan (if greenlit)
**Rust/Postgres path**
1) Stand up Docs Service skeleton (Rust) with gRPC/HTTP, PostgreSQL schema migrations, and a Yjs-compatible sync relay.
2) Implement Auth (JWT) + capability checks on doc endpoints.
3) Build minimal editor client (React + Yjs + TipTap or Rust egui with Yew/wasm) that can create/edit pages, show presence, and publish versions.
4) Add rule engine scaffold (Lua/Rhai) with on_publish hooks and an approval-required example.
5) Add search index (Tantivy) on publish and basic queries.
6) Wire audit/event log; surface in client.

**Firebase path**
1) Define Firestore data model (collections for spaces/pages/blocks/versions/rules) and set security rules aligned to capabilities.
2) Use Yjs Firestore provider for real-time CRDT edits; store snapshots/version metadata.
3) Hook Firebase Auth and map custom claims to roles; add callable functions for rule evaluation on publish.
4) Use Cloud Functions to index into a search service (e.g., Algolia) or lightweight Firestore-based search.
5) Store attachments in Firebase Storage with signed URLs; log events to Firestore or BigQuery (via export).

---

## Unreal Engine?
- Not required to start the documentation layer. Start with web/desktop to validate flows and rules quickly. Add UE once the API is stable if you want immersive visualization. If you prefer starting in UE now, confirm and we’ll outline the plugin/bridge steps.
