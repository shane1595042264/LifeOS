# LifeOS Architecture

## Purpose
Translates the North Star business layers into a concrete technical system composed of Client, Server (Identity, System, Evolution), and Tools (Execution). This is the blueprint for how the platform will be built and how data flows through it.

---

## Layer Mapping
- **Identity Layer (Who I Am)** → Identity Service on the server; long-lived records (values, baselines, personality, visions) plus version history.
- **System Layer (Life Engine / Rules)** → System Service on the server; rule/policy store, schedulers, protocol templates, and a scripting engine.
- **Execution Layer (Daily Life Usage / Tools)** → Tools runtime; user-facing actions, logging, project/task ops, integrations; orchestrated by the server but executed via plugin-capable tool runners.
- **Insights & Evolution (Self-Research)** → Evolution Service; analytics, dashboards, experiments, and recommendations that write back into Identity/System versions.
- **Client** → UE5 immersive UI + lightweight native desktop UI; primary interaction surface for logging, visualization, and tool invocation.

---

## High-Level Architecture
- **Client** communicates with the **Platform Services** over gRPC/Protobuf, using local SQLite for caching/offline. Clients receive state streams (subscriptions) and push user intents/logs.
- **Platform Services (Rust)** host Identity, System, Execution Orchestrator, and Evolution domains behind a unified API and auth layer. PostgreSQL is the system-of-record; object storage holds large blobs (attachments, exports).
- **Tools Runtime** executes actions (internal modules and external integrations). Tool runners can live client-side for low-latency actions or server-side for privileged/long-running work. A capability model restricts access per user/session.
- **Integration Bus** loads connector plugins (e.g., calendar, notes, fitness) as dynamic libraries, discoverable at runtime; jobs are scheduled via the orchestrator.
- **Analytics/ML Pipeline** ingests event logs and tool outputs into a fact table; batch/stream processors generate metrics, patterns, and evolution suggestions.

---

## Components

### Client
- **Interfaces:** UE5 gamified UI for immersive visualization; optional Rust native UI (egui/iced) for fast tabular dashboards.
- **Session & Auth:** Handles login and token refresh with the Identity service; can operate offline with deferred sync.
- **Local Cache:** SQLite mirror for logs, drafts, and recent metrics; sync engine reconciles with server truth.
- **Telemetry:** Emits structured events for every interaction to feed Evolution analytics.

### Platform Services (Server)
- **Identity Service:** User profile, values/mission, baselines, psychometrics, long-term visions, and version history. Issues session tokens/keys for clients and tool runners.
- **System Service:** Policy/rule store (scripts in Lua/Rhai), protocol templates (time, finance, entertainment, learning), scheduler, and finance/ledger primitives. Validates intents before execution.
- **Execution Orchestrator:** Receives intents (log entry, create contract, start project task), resolves required tools, dispatches to appropriate runner (client or server), and records outcomes/events.
- **Evolution Service:** Metrics computation, habit pattern detection, experiment management, and LifeOS version proposals. Writes recommended updates back to Identity/System with review gates.
- **Integration Bus:** Manages discovery, loading, and lifecycle of connector plugins; enforces capability scopes and rate limits.
- **API Gateway:** gRPC/Protobuf boundary exposing domain services; HTTP/JSON façade can sit atop for web/third parties.

### Tools Runtime (Execution Layer)
- **Tool Types:** Built-in primitives (log writer, scheduler, notification, ledger ops) and external connectors (calendar, notes, health trackers).
- **Placement:** Client-runner for latency-sensitive or user-environment actions; server-runner for privileged or long-running jobs.
- **Contracts:** Tools declare capabilities and data contracts (Protobuf messages); orchestrator enforces auth, input validation, and audit logging.
- **Extensibility:** Plugin format as Rust dynamic libraries (`.dll/.so`) or WASM modules; hot-reloadable with health checks.

### Data & Storage
- **System-of-Record:** PostgreSQL for core domains; schema-aligned to Identity/System/Evolution. Strong referential integrity and auditing.
- **Local Cache:** SQLite on client for offline-first usage; CRDT/last-write-wins rules for conflict resolution.
- **Event Log:** Append-only event stream (e.g., Kafka/NATS optional) capturing intents, tool runs, and analytics facts.
- **Object Storage:** Blobs for attachments/exports. Indexed in PostgreSQL with content hashes.
- **Observability:** Structured logging, metrics, and tracing across client, services, and tool runners.

---

## Key Flows (Happy Paths)
- **Log an entry:** Client captures entry → gRPC to Execution Orchestrator → System Service validates protocol → Identity/System context attached → Event persisted (PostgreSQL + event log) → Tool (e.g., notification) triggered → Evolution consumes event for metrics.
- **Invoke a tool:** Client issues intent → Orchestrator selects runner (client/server) based on capability/policy → Tool executes and emits result → Results stored and surfaced back to client; audit logged.
- **Insights to evolution:** Batch/stream jobs compute metrics → Evolution Service derives patterns and experiment suggestions → Proposed updates to Identity/System saved as new versions pending user approval → Client surfaces review UI.
- **Integration sync:** Scheduler triggers connector → Integration Bus loads plugin → Tool fetches/normalizes data → Stored in domain tables + event log → Evolution recomputes metrics.

---

## Governance & Security (Initial Posture)
- **AuthN/AuthZ:** Identity issues signed tokens with scoped capabilities; orchestrator enforces per-tool and per-resource scopes.
- **Data Boundaries:** PII and sensitive baselines encrypted at rest; secrets vault for connector credentials; least-privilege for tool runners.
- **Versioning:** Identity/System changes are versioned with diff history and rollback; experiments tracked with cohorts and outcomes.
- **Auditability:** Every intent, tool execution, and evolution recommendation is evented and queryable.

---

## Next Architecture Steps
- Define Protobuf contracts for core domains: Identity profile, Protocol/Rule, LogEntry, ToolIntent, ToolResult, Metric, Recommendation.
- Draft PostgreSQL schemas for Identity/System/Evolution tables and event log indices.
- Decide on scripting engine (Lua vs Rhai) and embed surface in System Service.
- Prototype orchestrator → tool runner contract and capability model; build one built-in tool and one external plugin to validate the flow.
