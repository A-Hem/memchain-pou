export class JobScheduler {
  constructor() {
    this.queue = new Map();
    this.priorities = new WeakMap();
  }

  addJob(job, priority = 0) {
    const id = crypto.randomUUID();
    this.queue.set(id, job);
    this.priorities.set(job, priority);
    return id;
  }

  getNext() {
    return [...this.queue.entries()]
      .sort((a, b) => this.priorities.get(b) - this.priorities.get(a))
      .shift()?.[1];
  }
}