//"AI Usefulness" Worker (`/src/workers/usefulness.js`)
```js
import { pipeline } from '@xenova/transformers';
import { memHash } from '../hashing/blake3.js';
import { TechnicalBERT } from './models/technical-bert.js'; // Custom trained model

export class UsefulnessWorker {
  constructor() {
    this.model = null;
    this.knowledgeCache = new Map();
  }

  async initialize() {
    this.model = await pipeline('text-classification', {
      model: TechnicalBERT,
      quantized: true // 4-bit quantization for speed
    });
  }

  async analyze(content, { contextTags = [] }) {
    // 1. Retrieve relevant context
    const context = await this._getContext(contextTags);
    const augmented = `${context}\n${content}`;

    // 2. Run model inference
    const { score } = await this.model(augmented);
    
    // 3. Generate verifiable hash
    return {
      score: this._normalizeScore(score),
      hash: memHash(augmented),
      model: TechnicalBERT.id
    };
  }

  async _getContext(tags) {
    const cacheKey = tags.sort().join('-');
    if (!this.knowledgeCache.has(cacheKey)) {
      const context = await this._fetchContextFromDHT(tags);
      this.knowledgeCache.set(cacheKey, context);
    }
    return this.knowledgeCache.get(cacheKey);
  }

  _normalizeScore(rawScore) {
    // Convert model-specific score to 0-1 range
    return Math.min(Math.max((rawScore + 1) / 2, 0), 1);
  }
}
