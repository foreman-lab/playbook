// Graph module — public surface (the state-machine engine).
// See: https://github.com/foreman-lab/handbook/blob/main/architecture.md

export type { Event, Graph, Machine, State, StateId, Transition } from "./types.js";

export {
  ConcurrencyConflictError,
  GraphError,
  InvalidGraphError,
  NoMatchingTransitionError,
  TerminalStateError,
  UnknownStateError,
} from "./errors.js";

export type { Store } from "./store.js";

export {
  eventSchema,
  graphSchema,
  machineSchema,
  stateSchema,
  transitionSchema,
  validateGraph,
} from "./schemas.js";

export { transition } from "./transition.js";
