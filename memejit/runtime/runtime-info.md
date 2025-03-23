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

### "defense in depth" 
## Maintains Decentralized JIT Vision
```js
// Safe execution with limited capabilities
const runtime = new JITRuntime(['math']);
const result = await runtime.execute(wasmModule, 42);

// Full-featured execution (caution!)
const fullRuntime = new JITRuntime(['math', 'io', 'net']);
```