### Key Management Options

| Mode          | Behavior                          | Security Level |
|---------------|-----------------------------------|----------------|
| `SWARM_KEY=auto` | Generates new key each session    | Basic (dev)    |
| `SWARM_KEY=persistent` | Saves key to `.swarmkey` | Medium (testing) |
| `SWARM_KEY=<private key>` | Use specific key      | Production     |




### Generate Production Key
```bash
# Generate permanent key
openssl genpkey -algorithm ED25519 -out .swarmkey
```

### Then set in `.env`:
```bash
SWARM_KEY="$(cat .swarmkey)"
```


This setup was meant to 
1. Require **zero configuration** for new users (auto-generates keys)
2. Allow **persistent identity** when needed
3. Enable **production-grade security** with explicit keys
4. Avoids complex key management by default

The compiler will work out-of-the-box while still allowing enterprise security patterns when required.