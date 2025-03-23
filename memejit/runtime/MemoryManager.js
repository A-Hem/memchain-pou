export class MemoryManager {
  constructor() {
    this.allocations = new WeakMap();
    this.arena = new WebAssembly.Memory({ initial: 100 });
  }

  track(instance) {
    this.allocations.set(instance, {
      size: instance.exports.memory.buffer.byteLength,
      lastUsed: Date.now()
    });
  }

  allocate(bytes) {
    const ptr = this.arena.grow(bytes);
    return { ptr, buffer: new Uint8Array(this.arena.buffer, ptr, bytes) };
  }
}