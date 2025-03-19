
//core proof of utility engine (`/src/util-engine.js`)
```js
import { memHash } from './hashing/blake3.js';
import { ZstdWorker } from './workers/compression.js';
import { UsefulnessWorker } from './workers/usefulness.js';
import { KnowledgeGraph } from './knowledge/graph.js';

const MIN_COMPRESSION = 2.0; // 50% size reduction
const MIN_USEFULNESS = 0.65; // 65% score threshold

export class PoUEngine {
  constructor({ swarm, swt }) {
    this.swarm = swarm;
    this.swt = swt;
    this.kg = new KnowledgeGraph();
    this.zstd = new ZstdWorker();
    this.usefulness = new UsefulnessWorker();
    
    this._initSwarm();
  }

  async _initSwarm() {
    await this.swarm.join(memHash('MEMCHAIN_POU'), {
      server: true,
      client: true
    });
    this.swarm.on('connection', this._handlePeer.bind(this));
  }

  async submit(data, { contextTags = [] }) {
    // 1. Context-aware compression
    const context = await this.kg.getContext(contextTags);
    const compressed = await this.zstd.compressWithContext(data, context);
    
    // 2. Usefulness validation
    const augmentedData = `${context}\n\n${data}`;
    const score = await this.usefulness.analyze(augmentedData);
    
    // 3. Generate PoU proof
    const proof = {
      hash: memHash(compressed),
      ratio: data.length / compressed.length,
      score,
      timestamp: Date.now()
    };

    if (this._validateProof(proof)) {
      const cid = await this._publish(compressed, proof);
      await this.swt.mint(cid, proof); // Mint SWT tokens
      return { cid, proof };
    }
    throw new Error('Invalid PoU proof');
  }

  _validateProof(proof) {
    const dynamicThreshold = this.kg.calculateDynamicThreshold();
    return proof.ratio >= MIN_COMPRESSION && 
           proof.score >= Math.max(MIN_USEFULNESS, dynamicThreshold);
  }

  async _publish(data, proof) {
    const cid = memHash(data);
    await this.swarm.put(cid, data, { proof });
    await this.kg.index(cid, proof);
    return cid;
  }
}
```
