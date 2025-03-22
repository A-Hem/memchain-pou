### Key Management Options

| Mode          | Behavior                          | Security Level |
|---------------|-----------------------------------|----------------|
| `SWARM_KEY=auto` | Generates new key each session    | Basic (dev)    |
| `SWARM_KEY=persistent` | Saves key to `.swarmkey` | Medium (testing) |
| `SWARM_KEY=<private key>` | Use specific key      | Production     |