import HyperDHT from 'hyperdht';

export class SwarmNetwork {
  constructor() {
    this.dht = new HyperDHT();
    this.node = this.dht.createNode();
  }

  async publish(wasm) {
    const key = crypto.createHash('blake2b').update(wasm).digest('hex');
    await this.node.put(key, wasm);
    return key;
  }
}