/**
 * Domain types for the graph state-machine module.
 * Pure declarations; no runtime code.
 *
 * The architecture spec lives in:
 *   https://github.com/foreman-lab/handbook/blob/main/architecture.md
 */

/** Reference to a State within a graph. Scoped by (graphId, version). */
export type StateId = string;

/** An event that can drive a transition. The engine reads only `type`; payload is opaque. */
export interface Event {
  type: string;
  payload: unknown;
  // Open envelope: callers MAY carry extra fields (timestamp, correlationId, source, etc.).
  // The engine ignores them but persists them through.
  [extra: string]: unknown;
}

/** A node in the graph. Identified within a graph. */
export interface State {
  id: StateId;
  label?: string;
  terminal?: boolean;
  meta?: Record<string, unknown>;
}

/** An edge in the graph. References two states by id. */
export interface Transition {
  from: StateId;
  event: string;
  to: StateId;
  label?: string;
  meta?: Record<string, unknown>;
}

/** The full graph: identified by (id, version), composed of states and transitions. */
export interface Graph {
  id: string;
  version: string;
  initialState: StateId;
  states: State[];
  transitions: Transition[];
}

/**
 * A stateful machine traversing a graph.
 * `revision` increments on every successful transition (optimistic concurrency).
 */
export interface Machine {
  id: string;
  graphId: string;
  graphVersion: string;
  revision: number;
  state: StateId;
  context: Record<string, unknown>;
  meta: Record<string, unknown>;
}
