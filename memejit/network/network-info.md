 ### Installation
```bash
npm install kad-dht ws # DHT + WebSocket support
```




```mermaid
graph LR
    A[Peer] --> B[Protocol]
    B --> C[DHT]
    C --> D[NAT]
    D --> E[Capabilities]
```