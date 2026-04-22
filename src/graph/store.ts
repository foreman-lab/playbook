/**
 * Outbound port: Store.
 *
 * Persists graphs (the static topology) and machines (runtime instances).
 * The application layer depends on this interface; concrete adapters
 * (memory, sqlite, …) implement it.
 *
 * The store does NOT validate inputs. Validation (e.g., `validateGraph`)
 * happens at the engine boundary (`register`/`dispatch`); callers wiring
 * the store directly are responsible for ensuring shape correctness.
 *
 * All persisted values (`Graph`, `Machine`, and anything carried inside
 * `payload` / `context` / `meta`) must be `structuredClone`-safe — i.e.,
 * JSON-like data: primitives, arrays, plain objects, Date, Map, Set, etc.
 * Functions, class instances, and DOM nodes will throw `DataCloneError`.
 *
 * Optimistic concurrency on machines: each successful save requires
 * `stored.revision === machine.revision - 1` (or no prior record when
 * `machine.revision === 0`). Mismatches throw `ConcurrencyConflictError`.
 */

import type { Graph, Machine } from "./types.js";

export interface Store {
  /** Save a graph. Idempotent on (graph.id, graph.version). */
  saveGraph(graph: Graph): Promise<void>;

  /** Load a graph by (id, version). Returns null if not found. */
  loadGraph(id: string, version: string): Promise<Graph | null>;

  /**
   * Save a machine with optimistic concurrency:
   *   - If no record exists for `machine.id`: insert if `machine.revision === 0`.
   *   - If a record exists: update only if `stored.revision === machine.revision - 1`.
   *   - Otherwise: throw `ConcurrencyConflictError`.
   *
   * @throws {ConcurrencyConflictError} when the optimistic-concurrency
   *   check fails. Callers may reload + reapply + retry, or surface to the user.
   */
  saveMachine(machine: Machine): Promise<void>;

  /** Load a machine by id. Returns null if not found. */
  loadMachine(machineId: string): Promise<Machine | null>;
}
