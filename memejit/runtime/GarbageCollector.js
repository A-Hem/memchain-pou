export class SurvivalGC {
  constructor(memory) {
    this.memory = memory;
    this.threshold = 0.7; // Survival score cutoff
  }

  analyze(instance) {
    const stats = this.memory.allocations.get(instance);
    const score = this._calculateFitness(stats);
    
    if (score < this.threshold) {
      this._reclaim(instance);
    }
  }

  _calculateFitness({ size, lastUsed }) {
    const age = Date.now() - lastUsed;
    return (1 / (size * age)) * 1e6; // Larger/newer → higher fitness
  }
}