export class Memory {
  constructor(maxBytes = 1024 * 1024 * 1024) { // 1GB default
    this.allocations = new Map();
    this.maxBytes = maxBytes;
    this.usedBytes = 0;
  }

  allocate(moduleId, initial = 256, maximum = this.maxBytes) {
    if (this.usedBytes + initial > this.maxBytes) {
      throw new MemoryError(`Exceeded memory limit (${this.maxBytes} bytes)`);
    }

    this.allocations.set(moduleId, {
      buffer: new WebAssembly.Memory({ initial, maximum }),
      size: initial
    });
    this.usedBytes += initial;
    return this.allocations.get(moduleId).buffer;
  }

  free(moduleId) {
    if (!this.allocations.has(moduleId)) return;
    
    this.usedBytes -= this.allocations.get(moduleId).size;
    this.allocations.delete(moduleId);
  }

  resize(moduleId, newSize) {
    const allocation = this.allocations.get(moduleId);
    if (!allocation) throw new Error('Unknown module');
    
    if (this.usedBytes + (newSize - allocation.size) > this.maxBytes) {
      throw new MemoryError('Memory limit exceeded');
    }
    
    allocation.size = newSize;
    allocation.buffer.grow(newSize - allocation.buffer.buffer.byteLength);
    this.usedBytes += newSize - allocation.size;
  }
}

class MemoryError extends Error {
  constructor(message) {
    super(message);
    this.name = "MemoryError";
  }
}