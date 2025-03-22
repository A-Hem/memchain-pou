import DHT from 'hyperdht';

export class JITSwarm {
  constructor() {
    this.dht = new DHT();
    this.node = this.dht.createNode();
    this.topic = 'jit-swarm-v1';
  }

  async join() {
    const { publicKey, secretKey } = crypto.generateKeyPairSync('ed25519');
    await this.node.listen(publicKey);
    this.node.on('connection', this._handleConnection);
  }

  async share(wasm) {
    const key = Buffer.from(this._hash(wasm));
    await this.dht.put(key, wasm);
  }

  async find(hash) {
    return this.dht.get(Buffer.from(hash));
  }
}
