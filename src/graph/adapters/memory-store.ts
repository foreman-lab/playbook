/**
 * In-memory `Store` adapter. Map-backed.
 *
 * Used for tests and as one of the two implementations required by
 * invariant I-4 (every outbound port has ≥2 implementations). The other
 * is `SqliteStore` (Sprint 4).
 *
 * Values are deep-cloned on save and load via `structuredClone` so the
 * store treats them as opaque snapshots — caller mutations after save
 * (or after load) do not corrupt stored state.
 */

import { ConcurrencyConflictError } from "../errors.js";
import type { Store } from "../store.js";
import type { Graph, Machine } from "../types.js";

export class MemoryStore implements Store {
  readonly #graphs = new Map<string, Graph>();
  readonly #machines = new Map<string, Machine>();

  async saveGraph(graph: Graph): Promise<void> {
    this.#graphs.set(graphKey(graph.id, graph.version), structuredClone(graph));
  }

  async loadGraph(id: string, version: string): Promise<Graph | null> {
    const stored = this.#graphs.get(graphKey(id, version));
    return stored === undefined ? null : structuredClone(stored);
  }

  async saveMachine(machine: Machine): Promise<void> {
    const stored = this.#machines.get(machine.id);
    const storedRevision = stored?.revision ?? null;

    const allowed =
      stored === undefined ? machine.revision === 0 : stored.revision === machine.revision - 1;

    if (!allowed) {
      throw new ConcurrencyConflictError(machine.id, machine.revision, storedRevision);
    }

    this.#machines.set(machine.id, structuredClone(machine));
  }

  async loadMachine(machineId: string): Promise<Machine | null> {
    const stored = this.#machines.get(machineId);
    return stored === undefined ? null : structuredClone(stored);
  }
}

function graphKey(id: string, version: string): string {
  return `${id}\u0000${version}`;
}
