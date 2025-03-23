### Installation 
npm install vm2 @noble/hashes # Core dependencies

```mermaid
graph TD
    A[User Code] --> B(Sandbox)
    B --> C{Capability Check}
    C -->|Allowed| D[WASI Syscalls]
    C -->|Denied| E[Error]
    D --> F[Hardened Memory]
    F --> G[GC Analysis]
```