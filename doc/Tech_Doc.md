# Tech Doc: LifeOS System Architecture

## Guiding Principles

The technical vision for LifeOS is to create a powerful, low-level, and extensible system capable of unifying a user's entire digital life. It is not merely an "app," but a foundational platform. The architecture must be built for longevity, performance, and deep integration with other systems. The future goal of a fully interactive, 3D/gamified interface via Unreal Engine is a primary driver of these architectural decisions.

---

## Proposed Technology Stack

### 1. Core System & Logic Layer

-   **Language: Rust**
    -   **Why:** For a system intended to be "low-level AF," Rust provides the performance of C/C++ without the risks of memory-related bugs. Its focus on safety and concurrency is ideal for building a reliable, long-running core system. Its strong type system and compile-time guarantees will be invaluable for a project of this complexity. Furthermore, its ability to compile to WebAssembly opens future doors for web-based components.

### 2. GUI & Visualization Layer

-   **Primary Interface (Gamified): Unreal Engine 5**
    -   **Why:** As requested, for the ultimate vision of a "gamified productive system" where a user can interact with their knowledge and tools in a visualized space (e.g., a memory palace), UE5 is the clear choice. It offers unparalleled 3D rendering capabilities.
    -   **Integration:** The Rust core will communicate with the UE5 front-end via a C-compatible API. We can use libraries like `unreal-rust` to facilitate this bridge, allowing us to call Rust functions from UE5's C++ environment.

-   **Secondary Interface (Traditional UI): Egui or Iced (Rust Native)**
    -   **Why:** While UE5 is powerful, it is overkill for simple, data-heavy views like dashboards, tables, and logs. A lightweight, native Rust GUI framework like `egui` (immediate mode) or `iced` (retained mode) can be used to create fast, cross-platform desktop applications for the more traditional "OS" functions. These can run as standalone apps or even be embedded in the UE5 environment.

### 3. Data & Storage Layer

-   **Primary Database: PostgreSQL**
    -   **Why:** A robust, open-source, and highly-extensible object-relational database. Its ability to handle complex queries and data types makes it suitable for unifying the disparate data from various productivity apps. It will serve as the central source of truth.

-   **Local/Embedded Database: SQLite**
    -   **Why:** For local client-side storage, caching, and offline capabilities. SQLite is serverless, file-based, and extremely reliable. The LifeOS client on a user's machine will use SQLite for all immediate data, which then syncs with the central PostgreSQL instance.

### 4. Integration & API Layer

-   **Internal Communication: gRPC**
    -   **Why:** For high-performance communication between the Rust core and other components (like the GUI), gRPC is an excellent choice. It uses Protocol Buffers for efficient data serialization.

-   **External Integration: Plugin Architecture**
    -   **Why:** To integrate with external apps (Notion, Google Calendar, Spotify, etc.), we will design a plugin-based architecture. Integrations will be developed as separate modules (e.g., Rust dynamic libraries, `.dll` or `.so` files) that the core LifeOS system can discover and load at runtime. This keeps the core system clean and allows the community to contribute new integrations easily.

### 5. Customization & Scripting Layer

-   **Scripting Language: Lua or Rhai**
    -   **Why:** To empower users to define their own rules and protocols (as described in the "System Layer" of the North Star doc), we will embed a scripting engine.
        -   **Lua:** A classic choice. It is extremely lightweight, fast, and easy to embed. It's a proven solution in game engines (like Unreal) and other high-performance applications.
        -   **Rhai:** A modern scripting language designed specifically for and written in Rust. It offers deep, safe integration with the core Rust codebase, making it a very compelling alternative.
